import {
  Address,
  AnchorError,
  Program,
  ProgramAccount,
  ProgramError,
  parseIdlErrors,
  translateError,
} from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  Commitment,
  Connection,
  ConnectionConfig,
  MemcmpFilter,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { ContractError, ICluster, ITransactionResult } from "@streamflow/common";
import { buildSendThrottler, prepareTransaction, signAndExecuteTransaction } from "@streamflow/common/solana";
import PQueue from "p-queue";

import {
  REWARD_POOL_PROGRAM_ID,
  STAKE_ENTRY_BYTE_OFFSETS,
  STAKE_POOL_BYTE_OFFSETS,
  STAKE_POOL_PROGRAM_ID,
} from "./constants.js";
import { FeeManager as FeeManagerProgramType } from "./descriptor/fee_manager.js";
import RewardPoolIDL from "./descriptor/idl/reward_pool.json";
import StakePoolIDL from "./descriptor/idl/stake_pool.json";
import { RewardPool as RewardPoolProgramType } from "./descriptor/reward_pool.js";
import { StakePool as StakePoolProgramType } from "./descriptor/stake_pool.js";
import {
  ClaimRewardPoolArgs,
  CreateRewardEntryArgs,
  CreateRewardPoolArgs,
  CreateStakePoolArgs,
  FundPoolArgs,
  IInteractSolanaExt,
  RewardPool,
  StakeArgs,
  StakeEntry,
  StakePool,
  UnstakeArgs,
} from "./types.js";
import { deriveRewardPoolPDA, deriveStakeEntryPDA, deriveStakeMintPDA, deriveStakePoolPDA } from "./utils.js";

interface Programs {
  stakePool: Program<StakePoolProgramType>;
  rewardPool: Program<RewardPoolProgramType>;
  feeManager?: Program<FeeManagerProgramType>;
}

interface IInitOptions {
  clusterUrl: string;
  cluster?: ICluster;
  commitment?: Commitment | ConnectionConfig;
  programIds?: {
    stakePool?: string;
    rewardPool?: string;
    feeManager?: string;
  };
  sendRate?: number;
  sendThrottler?: PQueue;
}

export default class SolanaStakingClient {
  connection: Connection;

  private commitment: Commitment | ConnectionConfig;

  private sendThrottler: PQueue;

  private programs: Programs;

  constructor({
    clusterUrl,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cluster = ICluster.Mainnet,
    commitment = "confirmed",
    programIds,
    sendRate = 1,
    sendThrottler,
  }: IInitOptions) {
    this.commitment = commitment;
    this.connection = new Connection(clusterUrl, this.commitment);
    this.sendThrottler = sendThrottler ?? buildSendThrottler(sendRate);
    const stakePoolIdl = {
      ...StakePoolIDL,
      address: programIds?.stakePool ?? STAKE_POOL_PROGRAM_ID[cluster] ?? StakePoolIDL.address, // todo pick with cluster
    } as StakePoolProgramType;
    const rewardPoolIdl = {
      ...RewardPoolIDL,
      address: programIds?.rewardPool ?? REWARD_POOL_PROGRAM_ID[cluster] ?? RewardPoolIDL.address, // todo pick with cluster
    } as RewardPoolProgramType;
    this.programs = {
      stakePool: new Program(stakePoolIdl, {
        connection: this.connection,
      }) as Program<StakePoolProgramType>,
      rewardPool: new Program(rewardPoolIdl, {
        connection: this.connection,
      }) as Program<RewardPoolProgramType>,
    };
  }

  getCurrentProgramId(programKey: keyof Programs): PublicKey {
    const program = this.programs[programKey];
    invariant(program, `Program ${programKey} is not found`);
    return program.programId;
  }

  getCommitment(): Commitment | undefined {
    return typeof this.commitment == "string" ? this.commitment : this.commitment.commitment;
  }

  getStakePool(id: string | PublicKey): Promise<StakePool> {
    const stakeProgram = this.programs.stakePool;
    return stakeProgram.account.stakePool.fetch(id);
  }

  async searchStakePools(
    criteria: Partial<Pick<StakePool, "mint" | "creator">> = {},
  ): Promise<ProgramAccount<StakePool>[]> {
    const stakeProgram = this.programs.stakePool;

    const filters: MemcmpFilter[] = Object.entries(criteria).reduce((acc, [key, value]) => {
      const criteriaKey = key as keyof typeof criteria;
      const effectiveByteOffset = STAKE_POOL_BYTE_OFFSETS[criteriaKey];
      if (criteria[criteriaKey] && effectiveByteOffset) {
        acc.push({
          memcmp: {
            offset: effectiveByteOffset,
            bytes: value.toString(),
          },
        });
      }
      return acc;
    }, [] as MemcmpFilter[]);

    return stakeProgram.account.stakePool.all(filters);
  }

  getStakeEntry(id: string | PublicKey): Promise<StakeEntry | null> {
    const stakeProgram = this.programs.stakePool;
    return stakeProgram.account.stakeEntry.fetch(id);
  }

  async searchStakeEntries(
    criteria: Partial<Pick<StakeEntry, "payer" | "stakePool">> = {},
  ): Promise<ProgramAccount<StakeEntry>[]> {
    const stakeProgram = this.programs.stakePool;

    const filters: MemcmpFilter[] = Object.entries(criteria).reduce((acc, [key, value]) => {
      const criteriaKey = key as keyof typeof criteria;
      const effectiveByteOffset = STAKE_ENTRY_BYTE_OFFSETS[criteriaKey];
      if (criteria[criteriaKey] && effectiveByteOffset) {
        acc.push({
          memcmp: {
            offset: effectiveByteOffset,
            bytes: value.toString(),
          },
        });
      }
      return acc;
    }, [] as MemcmpFilter[]);

    return stakeProgram.account.stakeEntry.all(filters);
  }

  async searchRewardPools(
    criteria: Partial<Pick<RewardPool, "stakePool" | "mint">> = {},
  ): Promise<ProgramAccount<RewardPool>[]> {
    const rewardProgram = this.programs.rewardPool;

    const filters: MemcmpFilter[] = Object.entries(criteria).reduce((acc, [key, value]) => {
      const criteriaKey = key as keyof typeof criteria;
      if (criteria[criteriaKey]) {
        acc.push({
          memcmp: {
            offset: 0,
            bytes: value.toString(),
          },
        });
      }
      return acc;
    }, [] as MemcmpFilter[]);

    return rewardProgram.account.rewardPool.all(filters);
  }

  async createStakePool(
    data: CreateStakePoolArgs,
    extParams: IInteractSolanaExt,
  ): Promise<ITransactionResult & { metadataId: PublicKey }> {
    const { ixs, publicKey } = await this.prepareCreateStakePoolInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
      metadataId: publicKey,
    };
  }

  async prepareCreateStakePoolInstructions(
    {
      maxWeight,
      maxDuration,
      minDuration,
      mint,
      permissionless = false,
      nonce,
      tokenProgramId = TOKEN_PROGRAM_ID,
    }: CreateStakePoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const stakeProgram = this.programs.stakePool;
    const creator = extParams.invoker.publicKey;
    invariant(creator, "Undefined invoker publicKey");
    const createInstruction = await stakeProgram.methods
      .createPool(nonce, maxWeight, minDuration, maxDuration, permissionless)
      .accounts({
        creator,
        mint,
        tokenProgram: tokenProgramId,
      })
      .instruction();

    const stakePoolPDA = deriveStakePoolPDA(stakeProgram.programId, pk(mint), creator, nonce);

    return { ixs: [createInstruction], publicKey: stakePoolPDA };
  }

  async stake(data: StakeArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareStakeInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareStakeInstructions(
    { nonce, amount, duration, stakePool, stakePoolMint, tokenProgramId = TOKEN_PROGRAM_ID }: StakeArgs,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const stakeProgram = this.programs.stakePool;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const mint = deriveStakeMintPDA(stakeProgram.programId, pk(stakePool));
    const poolMintAccountKey = getAssociatedTokenAddressSync(mint, staker, false, pk(tokenProgramId));
    const stakeMintAccountKey = getAssociatedTokenAddressSync(
      pk(stakePoolMint),
      staker,
      false,
      pk(tokenProgramId),
    );
    const instruction = await stakeProgram.methods
      .stake(nonce, amount, duration)
      .accounts({
        stakePool: stakePool,
        tokenProgram: tokenProgramId,
        from: poolMintAccountKey,
        to: stakeMintAccountKey,
        authority: staker,
        payer: staker,
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async unstake(data: StakeArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareStakeInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareUnstakeInstructions(
    { stakePool, stakePoolMint, nonce, tokenProgramId = TOKEN_PROGRAM_ID }: UnstakeArgs,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const stakeProgram = this.programs.stakePool;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const stakeMintKey = deriveStakeMintPDA(stakeProgram.programId, pk(stakePool));
    const stakeEntryKey = deriveStakeEntryPDA(stakeProgram.programId, pk(stakePool), staker, nonce);
    const poolMintAccountKey = getAssociatedTokenAddressSync(
      pk(stakePoolMint),
      staker,
      false,
      pk(tokenProgramId),
    );
    const stakeMintAccountKey = getAssociatedTokenAddressSync(
      stakeMintKey,
      staker,
      false,
      pk(tokenProgramId),
    );
    const instruction = await stakeProgram.methods
      .unstake()
      .accounts({
        stakeEntry: stakeEntryKey,
        from: poolMintAccountKey,
        to: stakeMintAccountKey,
        authority: staker,
        tokenProgram: tokenProgramId,
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async createRewardPool(
    data: CreateRewardPoolArgs,
    extParams: IInteractSolanaExt,
  ): Promise<ITransactionResult> {
    const { ixs } = await this.prepareCreateRewardPoolInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareCreateRewardPoolInstructions(
    {
      nonce,
      rewardAmount,
      rewardPeriod,
      permissionless = false,
      stakePool,
      stakePoolMint,
      tokenProgramId = TOKEN_PROGRAM_ID,
    }: CreateRewardPoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const rewardProgram = this.programs.rewardPool;
    const creator = extParams.invoker.publicKey;
    invariant(creator, "Undefined invoker publicKey");
    const instruction = await rewardProgram.methods
      .createPool(nonce, rewardAmount, rewardPeriod, permissionless)
      .accounts({
        creator,
        stakePool,
        mint: stakePoolMint,
        tokenProgram: tokenProgramId,
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async claimRewards(data: ClaimRewardPoolArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareClaimRewardsInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareClaimRewardsInstructions(
    { nonce, stakePoolNonce, stakePool, tokenProgramId = TOKEN_PROGRAM_ID, rewardMint }: ClaimRewardPoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const stakeProgram = this.programs.stakePool;
    const rewardProgram = this.programs.rewardPool;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const instruction = await rewardProgram.methods
      .claimRewards()
      .accounts({
        stakeEntry: deriveStakeEntryPDA(stakeProgram.programId, pk(stakePool), staker, stakePoolNonce),
        rewardPool: deriveRewardPoolPDA(rewardProgram.programId, pk(stakePool), pk(rewardMint), nonce),
        claimant: staker,
        tokenProgram: tokenProgramId,
        to: getAssociatedTokenAddressSync(pk(rewardMint), staker, false, pk(tokenProgramId)),
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async fundPool(data: FundPoolArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareFundPoolInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareFundPoolInstructions(
    { amount, stakePoolMint, tokenProgramId = TOKEN_PROGRAM_ID, stakePool, nonce }: FundPoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const rewardProgram = this.programs.rewardPool;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const instruction = await rewardProgram.methods
      .fundPool(amount)
      .accounts({
        funder: staker,
        rewardPool: deriveRewardPoolPDA(rewardProgram.programId, pk(stakePool), pk(stakePoolMint), nonce),
        from: getAssociatedTokenAddressSync(pk(stakePoolMint), staker, false, pk(tokenProgramId)),
        tokenProgram: tokenProgramId,
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async createRewardEntry(
    data: CreateRewardEntryArgs,
    extParams: IInteractSolanaExt,
  ): Promise<ITransactionResult> {
    const { ixs } = await this.prepareCreateRewardEntryInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareCreateRewardEntryInstructions(
    { stakePoolMint, stakePool, nonce, stakePoolNonce }: CreateRewardEntryArgs,
    extParams: IInteractSolanaExt,
  ) {
    const stakeProgram = this.programs.stakePool;
    const rewardProgram = this.programs.rewardPool;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const instruction = await rewardProgram.methods
      .createEntry()
      .accounts({
        payer: staker,
        authority: staker,
        stakeEntry: deriveStakeEntryPDA(stakeProgram.programId, pk(stakePool), staker, stakePoolNonce),
        rewardPool: deriveRewardPoolPDA(rewardProgram.programId, pk(stakePool), pk(stakePoolMint), nonce),
      })
      .instruction();

    return { ixs: [instruction] };
  }

  private async execute(ixs: TransactionInstruction[], extParams: IInteractSolanaExt) {
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, extParams.invoker.publicKey);

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
    } catch (err: any) {
      if (err instanceof Error) {
        const parsed: AnchorError | ProgramError | typeof err = translateError(
          err,
          parseIdlErrors(this.programs.stakePool.idl), // TODO how to catch an error from a specific program?
        );
        if (parsed) {
          throw new ContractError(err, parsed.name, parsed.message);
        }
      }
      throw err;
    }
  }
}

function pk(address: Address): PublicKey {
  return typeof address === "string" ? new PublicKey(address) : address;
}

const prefix = "Assertion failed";
function invariant(condition: any, message?: string | (() => string)): asserts condition {
  if (condition) {
    return;
  }
  const provided: string | undefined = typeof message === "function" ? message() : message;
  const value: string = provided ? `${prefix}: ${provided}` : prefix;
  throw new Error(value);
}
