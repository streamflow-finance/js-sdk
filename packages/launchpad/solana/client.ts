import { Program, parseIdlErrors, translateError } from "@coral-xyz/anchor";
import type { AnchorError, ProgramError, ProgramAccount, Address } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, createTransferCheckedInstruction } from "@solana/spl-token";
import {
  type Commitment,
  Connection,
  type ConnectionConfig,
  PublicKey,
  TransactionInstruction,
  Keypair,
  clusterApiUrl,
} from "@solana/web3.js";
import { ContractError, ICluster, invariant, getBN, type ITransactionResult } from "@streamflow/common";
import {
  buildSendThrottler,
  checkOrCreateAtaBatch,
  getFilters,
  pk,
  getMintAndProgram,
  prepareTransaction,
  signAndExecuteTransaction,
  prepareBaseInstructions,
} from "@streamflow/common/solana";
import {
  constants as streamConstants,
  type OracleType,
  deriveTestOraclePDA,
  deriveContractPDA,
  deriveEscrowPDA,
} from "@streamflow/stream/solana";
import BN from "bn.js";
import type PQueue from "p-queue";

import { LAUNCHPAD_BYTE_OFFSETS, PROGRAM_ID } from "./constants.js";
import StreamflowLaunchpadIDL from "./descriptor/idl/streamflow_launchpad.json";
import type { StreamflowLaunchpad } from "./descriptor/streamflow_launchpad.js";
import { deriveDepositPDA, deriveLaunchpadPDA } from "./lib/derive-accounts.js";
import {
  type DepositAccount,
  type Launchpad,
  type IInteractSolanaExt,
  type ICreateLaunchpad,
  type IDeposit,
  type IClaimDeposits,
  type IClaimAllocatedVested,
  type IFundLaunchpad,
} from "./types.js";

interface IInitOptions {
  clusterUrl?: string;
  cluster?: ICluster;
  commitment?: Commitment | ConnectionConfig;
  programIds?: {
    launchpad?: string;
    vesting?: string;
    dynamicVesting?: string;
  };
  sendRate?: number;
  sendThrottler?: PQueue;
}

type CreationResult = ITransactionResult & { metadataId: PublicKey };

export class SolanaLaunchpadClient {
  connection: Connection;

  cluster: ICluster;

  private readonly commitment: Commitment | ConnectionConfig;

  private readonly sendThrottler: PQueue;

  private readonly dynamicVestingId: PublicKey;

  private readonly vestingId: PublicKey;

  public readonly program: Program<StreamflowLaunchpad>;

  constructor({
    clusterUrl,
    cluster = ICluster.Mainnet,
    commitment = "confirmed",
    programIds,
    sendRate = 1,
    sendThrottler,
  }: IInitOptions) {
    this.commitment = commitment;
    if (!clusterUrl) {
      switch (cluster) {
        case ICluster.Mainnet:
          clusterUrl = clusterApiUrl("mainnet-beta");
          break;
        case ICluster.Local:
          clusterUrl = "http://localhost:8899";
          break;
        default:
          clusterUrl = clusterApiUrl(cluster);
          break;
      }
    }
    this.connection = new Connection(clusterUrl, this.commitment);
    this.cluster = cluster;
    this.sendThrottler = sendThrottler ?? buildSendThrottler(sendRate);

    const launchpadIdl = {
      ...StreamflowLaunchpadIDL,
      address: programIds?.launchpad ?? PROGRAM_ID[cluster] ?? StreamflowLaunchpadIDL.address,
    } as StreamflowLaunchpad;
    this.program = new Program(launchpadIdl, {
      connection: this.connection,
    }) as Program<StreamflowLaunchpad>;
    this.dynamicVestingId = pk(
      programIds?.dynamicVesting ? programIds.dynamicVesting : streamConstants.ALIGNED_UNLOCKS_PROGRAM_ID[cluster],
    );
    this.vestingId = pk(programIds?.vesting ? programIds.vesting : streamConstants.PROGRAM_ID[cluster]);
  }

  getCurrentProgramId(): PublicKey {
    invariant(this.program, `Program is not found`);
    return this.program.programId;
  }

  getCommitment(): Commitment | undefined {
    return typeof this.commitment == "string" ? this.commitment : this.commitment.commitment;
  }

  getLaunchpad(id: Address): Promise<Launchpad> {
    return this.program.account.launchpad.fetch(id);
  }

  searchLaunchpads(
    criteria: Partial<Pick<Launchpad, keyof typeof LAUNCHPAD_BYTE_OFFSETS>> = {},
  ): Promise<ProgramAccount<Launchpad>[]> {
    return this.program.account.launchpad.all(getFilters(criteria, LAUNCHPAD_BYTE_OFFSETS));
  }

  getDepositAccount(id: Address): Promise<DepositAccount> {
    return this.program.account.depositAccount.fetch(id);
  }

  async createLaunchpad(data: ICreateLaunchpad, extParams: IInteractSolanaExt): Promise<CreationResult> {
    const { ixs, publicKey } = await this.prepareCreateLaunchpadInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);
    return {
      ixs,
      txId: signature,
      metadataId: publicKey,
    };
  }

  async prepareCreateLaunchpadInstructions(
    {
      baseMint: baseMintKey,
      quoteMint: quoteMintKey,
      receiver,
      priceOracle,
      nonce,
      price,
      individualDepositingCap,
      maxDepositingCap,
      depositingStartTs,
      depositingEndTs,
      vestingStartTs,
      vestingEndTs,
      vestingPeriod,
      oracleType,
      minPrice,
      maxPrice,
      minPercentage,
      maxPercentage,
      tickSize,
      skipInitial,
      isMemoRequired,
      tokenProgramId = TOKEN_PROGRAM_ID,
    }: ICreateLaunchpad,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
    publicKey: PublicKey;
  }> {
    baseMintKey = pk(baseMintKey);
    quoteMintKey = pk(quoteMintKey);
    const authority = extParams.invoker.publicKey;

    invariant(authority, "Undefined creator publicKey");

    if (!priceOracle && oracleType && !["none", "test"].includes(oracleType)) {
      throw new Error("Price oracle is required for the specified oracle type");
    }

    receiver = receiver ?? getAssociatedTokenAddressSync(quoteMintKey, authority);
    const oracle = priceOracle ?? deriveTestOraclePDA(this.dynamicVestingId, baseMintKey, authority);
    const launchpadPDA = deriveLaunchpadPDA(this.program.programId, baseMintKey, nonce);

    const createIx = await this.program.methods
      .createLaunchpad({
        nonce,
        price,
        individualDepositingCap,
        maxDepositingCap,
        depositingStartTs: new BN(depositingStartTs),
        depositingEndTs: new BN(depositingEndTs),
        vestingStartTs: new BN(vestingStartTs),
        vestingEndTs: new BN(vestingEndTs),
        vestingPeriod: new BN(vestingPeriod),
        oracleType: (!!oracleType ? { [oracleType]: {} } : { none: {} }) as OracleType,
        minPrice: getBN(minPrice, streamConstants.ALIGNED_PRECISION_FACTOR_POW),
        maxPrice: getBN(maxPrice, streamConstants.ALIGNED_PRECISION_FACTOR_POW),
        minPercentage: getBN(minPercentage, streamConstants.ALIGNED_PRECISION_FACTOR_POW),
        maxPercentage: getBN(maxPercentage, streamConstants.ALIGNED_PRECISION_FACTOR_POW),
        tickSize: getBN(tickSize, streamConstants.ALIGNED_PRECISION_FACTOR_POW),
        skipInitial,
        isMemoRequired,
      })
      .accounts({
        authority,
        baseMint: baseMintKey,
        quoteMint: quoteMintKey,
        receiver: receiver,
        priceOracle: oracle,
        tokenProgram: tokenProgramId,
      })
      .instruction();

    return { ixs: [createIx], publicKey: launchpadPDA };
  }

  async fundLaunchpad(data: IFundLaunchpad, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareFundLaunchpadInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);
    return {
      ixs,
      txId: signature,
    };
  }

  async prepareFundLaunchpadInstructions(
    { launchpad: launchpadKey, amount, baseMint: baseMintKey, tokenProgramId = TOKEN_PROGRAM_ID }: IFundLaunchpad,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const authority = extParams.invoker.publicKey;
    invariant(authority, "Undefined authority publicKey");

    if (!baseMintKey) {
      baseMintKey = (await this.getLaunchpad(launchpadKey)).baseMint;
    }
    const { mint } = await getMintAndProgram(this.connection, pk(baseMintKey));

    return {
      ixs: [
        ...(await checkOrCreateAtaBatch(
          this.connection,
          [pk(launchpadKey)],
          pk(baseMintKey),
          extParams.invoker,
          pk(tokenProgramId),
        )),
        createTransferCheckedInstruction(
          getAssociatedTokenAddressSync(mint.address, authority, true, pk(tokenProgramId)),
          mint.address,
          getAssociatedTokenAddressSync(mint.address, pk(launchpadKey), true, pk(tokenProgramId)),
          authority,
          BigInt(amount.toString()),
          mint.decimals,
          undefined,
          pk(tokenProgramId),
        ),
      ],
    };
  }

  async deposit(data: IDeposit, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareDepositInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);
    return {
      ixs,
      txId: signature,
    };
  }

  async prepareDepositInstructions(
    {
      launchpad: launchpadKey,
      quoteMint: quoteMintKey,
      amount,
      autoCap = false,
      memo,
      owner,
      tokenProgramId = TOKEN_PROGRAM_ID,
    }: IDeposit,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
    publicKey: PublicKey;
  }> {
    const payer = extParams.invoker.publicKey;
    invariant(payer, "Undefined payer publicKey");

    owner = pk(owner ?? payer);
    if (!quoteMintKey) {
      quoteMintKey = (await this.getLaunchpad(launchpadKey)).quoteMint;
    }

    const depositPDA = deriveDepositPDA(this.program.programId, pk(launchpadKey), owner);
    const ixs: TransactionInstruction[] = [];
    if (memo) {
      ixs.push(
        new TransactionInstruction({
          keys: [{ pubkey: payer, isSigner: true, isWritable: true }],
          data: Buffer.from(memo, "utf-8"),
          programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
        }),
      );
    }
    ixs.push(
      await this.program.methods
        .deposit({ amount, autoCap })
        .accounts({
          payer,
          owner: owner,
          from: getAssociatedTokenAddressSync(pk(quoteMintKey), payer, true, pk(tokenProgramId)),
          launchpad: launchpadKey,
          tokenProgram: tokenProgramId,
        })
        .instruction(),
    );

    return { ixs, publicKey: depositPDA };
  }

  async claimDeposits(data: IClaimDeposits, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareClaimDepositsInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);
    return {
      ixs,
      txId: signature,
    };
  }

  async prepareClaimDepositsInstructions(
    { launchpad: launchpadKey, tokenProgramId = TOKEN_PROGRAM_ID }: IClaimDeposits,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const authority = extParams.invoker.publicKey;
    invariant(authority, "Undefined authority publicKey");

    return {
      ixs: [
        await this.program.methods
          .claimDeposits()
          .accounts({
            authority,
            launchpad: launchpadKey,
            tokenProgram: tokenProgramId,
          })
          .instruction(),
      ],
    };
  }

  async claimAllocatedVested(data: IClaimAllocatedVested, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    if (!extParams.computeLimit) {
      extParams.computeLimit = 280_000;
    }
    const { ixs, streamKeypair } = await this.prepareClaimAllocatedVestedInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams, streamKeypair);
    return {
      ixs,
      txId: signature,
    };
  }

  async prepareClaimAllocatedVestedInstructions(
    { launchpad: launchpadKey, baseMint: baseMintKey, owner, tokenProgramId = TOKEN_PROGRAM_ID }: IClaimAllocatedVested,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
    streamKeypair: Keypair;
  }> {
    const payer = extParams.invoker.publicKey;
    invariant(payer, "Undefined payer publicKey");

    owner = pk(owner ?? payer);
    if (!baseMintKey) {
      baseMintKey = (await this.getLaunchpad(launchpadKey)).baseMint;
    }
    const streamKeypair = Keypair.generate();
    const streamKey = streamKeypair.publicKey;
    const proxyMetadataKey = deriveContractPDA(this.dynamicVestingId, streamKeypair.publicKey);
    const proxyTokensKey = getAssociatedTokenAddressSync(pk(baseMintKey), proxyMetadataKey, true);
    const escrowKey = deriveEscrowPDA(this.vestingId, streamKeypair.publicKey);
    const depositKey = deriveDepositPDA(this.program.programId, pk(launchpadKey), owner);

    const ix = await this.program.methods
      .claimAllocatedVested()
      .accounts({
        depositAccount: depositKey,
        payer,
        proxyMetadata: proxyMetadataKey,
        proxyTokens: proxyTokensKey,
        streamMetadata: streamKey,
        escrowTokens: escrowKey,
        withdrawor: streamConstants.WITHDRAWOR_PUBLIC_KEY,
        feeOracle: streamConstants.FEE_ORACLE_PUBLIC_KEY,
        tokenProgram: tokenProgramId,
      })
      .accountsPartial({
        streamflowProgram: this.vestingId,
        proxyProgram: this.dynamicVestingId,
      })
      .instruction();

    return { ixs: [ix], streamKeypair };
  }

  private async execute(
    ixs: TransactionInstruction[],
    extParams: IInteractSolanaExt,
    ...partialSigners: (Keypair | undefined)[]
  ) {
    ixs = [...prepareBaseInstructions(this.connection, extParams), ...ixs];
    const { tx, hash, context } = await prepareTransaction(
      this.connection,
      ixs,
      extParams.invoker.publicKey,
      this.getCommitment(),
      ...partialSigners,
    );

    try {
      const signature = await signAndExecuteTransaction(
        this.connection,
        extParams.invoker,
        tx,
        {
          hash,
          context,
          commitment: this.getCommitment(),
        },
        { sendThrottler: this.sendThrottler },
      );
      return { signature };
    } catch (err: unknown) {
      if (err instanceof Error) {
        const parsed: AnchorError | ProgramError | typeof err = translateError(err, parseIdlErrors(this.program.idl));
        if (parsed) {
          throw new ContractError(err, parsed.name, parsed.message);
        }
      }
      throw err;
    }
  }
}
