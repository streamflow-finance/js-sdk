import { AnchorError, Program, ProgramAccount, ProgramError, parseIdlErrors, translateError } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  Commitment,
  Connection,
  ConnectionConfig,
  MemcmpFilter,
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { ContractError, ICluster, ITransactionResult } from "@streamflow/common";
import {
  ConfirmationParams,
  ThrottleParams,
  buildSendThrottler,
  prepareTransaction,
  signAndExecuteTransaction,
} from "@streamflow/common/solana";
import PQueue from "p-queue";

import { FeeManager as FeeManagerProgramType } from "./descriptor/fee_manager.js";
import RewardPoolIDL from "./descriptor/idl/reward_pool.json";
import StakePoolIDL from "./descriptor/idl/stake_pool.json";
import { RewardPool as RewardPoolProgramType } from "./descriptor/reward_pool.js";
import { StakePool as StakePoolProgramType } from "./descriptor/stake_pool.js";
import { STAKE_ENTRY_OWNER_OFFSET, STAKE_ENTRY_STAKE_POOL_OFFSET, STAKE_POOL_MINT_OFFSET } from "./constants.js";
import {
  ClaimRewardPoolArgs,
  CreateRewardEntryArgs,
  CreateRewardPoolArgs,
  CreateStakePoolArgs,
  FundPoolArgs,
  GetStakeEntriesData,
  IInteractSolanaExt,
  StakeArgs,
  StakeEntry,
  StakePool,
  UnstakeArgs,
} from "./types.js";
import { deriveRewardPoolPDA, deriveStakeEntryPDA, deriveStakePoolPDA } from "./utils.js";

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

async function wrappedSignAndExecuteTransaction(
  connection: Connection,
  invoker: IInteractSolanaExt["invoker"],
  tx: Transaction | VersionedTransaction,
  confirmationParams: ConfirmationParams,
  throttleParams: ThrottleParams,
  programs: Programs,
): Promise<string> {
  try {
    return await signAndExecuteTransaction(connection, invoker, tx, confirmationParams, throttleParams);
  } catch (err: any) {
    if (err instanceof Error) {
      const parsed: AnchorError | ProgramError | typeof err = translateError(
        err,
        parseIdlErrors(programs.stakePool.idl), // TODO how to catch an error from a specific program?
      );
      if (parsed) {
        throw new ContractError(err, parsed.name, parsed.message);
      }
    }
    throw err;
  }
}

export default class SolanaStakingClient {
  private connection: Connection;

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
      address: programIds?.stakePool ?? StakePoolIDL.address, // todo pick with cluster
    } as StakePoolProgramType;
    const rewardPoolIdl = {
      ...RewardPoolIDL,
      address: programIds?.rewardPool ?? RewardPoolIDL.address, // todo pick with cluster
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

  getCommitment(): Commitment | undefined {
    return typeof this.commitment == "string" ? this.commitment : this.commitment.commitment;
  }

  getStakePools(): Promise<ProgramAccount<StakePool>[]> {
    const stakeProgram = this.programs.stakePool;
    return stakeProgram.account.stakePool.all();
  }

  getStakePool(id: string | PublicKey): Promise<StakePool> {
    const stakeProgram = this.programs.stakePool;
    return stakeProgram.account.stakePool.fetch(id);
  }

  async searchStakePools(criteria: { mint: string | PublicKey }): Promise<ProgramAccount<StakePool>[]> {
    const stakeProgram = this.programs.stakePool;

    const filters: MemcmpFilter[] = [];
    if (criteria.mint) {
      filters.push({
        memcmp: {
          offset: STAKE_POOL_MINT_OFFSET,
          bytes: criteria.mint.toString(),
        },
      });
    }

    const accounts = await stakeProgram.provider.connection.getProgramAccounts(stakeProgram.programId, {
      filters,
    });

    return accounts.map(({ pubkey, account }) => {
      return {
        publicKey: pubkey,
        account: stakeProgram.coder.accounts.decode<StakePool>(stakeProgram.idl.types[1].name, account.data),
      };
    });
  }

  getStakeEntry(id: string | PublicKey): Promise<StakeEntry | null> {
    const stakeProgram = this.programs.stakePool;
    return stakeProgram.account.stakeEntry.fetch(id);
  }

  async getStakeEntries(data: GetStakeEntriesData): Promise<ProgramAccount<StakeEntry>[]> {
    const stakeProgram = this.programs.stakePool;

    const filters: MemcmpFilter[] = [];
    if (data.owner) {
      filters.push({
        memcmp: {
          offset: STAKE_ENTRY_OWNER_OFFSET,
          bytes: data.owner.toString(),
        },
      });
    }
    if (data.stakePool) {
      filters.push({
        memcmp: {
          offset: STAKE_ENTRY_STAKE_POOL_OFFSET,
          bytes: data.stakePool.toString(),
        },
      });
    }

    const accounts = await stakeProgram.provider.connection.getProgramAccounts(stakeProgram.programId, {
      filters,
    });

    return accounts.map(({ account, pubkey }) => {
      return {
        publicKey: pubkey,
        account: stakeProgram.coder.accounts.decode<StakeEntry>(stakeProgram.idl.types[0].name, account.data),
      };
    });
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

    const stakePoolPDA = deriveStakePoolPDA(stakeProgram.programId, new PublicKey(mint), creator, nonce);

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
    { nonce, amount, duration, stakePoolKey, tokenProgramId = TOKEN_PROGRAM_ID, from, to }: StakeArgs,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const stakeProgram = this.programs.stakePool;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const instruction = await stakeProgram.methods
      .stake(nonce, amount, duration)
      .accounts({
        stakePool: stakePoolKey,
        tokenProgram: tokenProgramId,
        from,
        to,
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
    { stakePoolKey, stakeMint, tokenProgramId = TOKEN_PROGRAM_ID }: UnstakeArgs,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const stakeProgram = this.programs.stakePool;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const { from, to } = {
      from: getAssociatedTokenAddressSync(new PublicKey(stakeMint), new PublicKey(stakePoolKey), false, tokenProgramId),
      to: getAssociatedTokenAddressSync(new PublicKey(stakeMint), staker, false, tokenProgramId),
    };
    const instruction = await stakeProgram.methods
      .unstake()
      .accounts({
        stakeEntry: stakePoolKey,
        tokenProgram: tokenProgramId,
        from,
        to,
        authority: staker,
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async createRewardPool(data: CreateRewardPoolArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
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
      tokenProgramId = TOKEN_PROGRAM_ID,
      stakePoolMint,
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
    { nonce, stakePool, tokenProgramId = TOKEN_PROGRAM_ID, stakePoolMint, rewardMint }: ClaimRewardPoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const stakeProgram = this.programs.stakePool;
    const rewardProgram = this.programs.rewardPool;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const instruction = await rewardProgram.methods
      .claimRewards()
      .accounts({
        stakeEntry: deriveStakeEntryPDA(stakeProgram.programId, new PublicKey(stakePool), staker, nonce),
        rewardPool: deriveRewardPoolPDA(
          rewardProgram.programId,
          new PublicKey(stakePool),
          new PublicKey(stakePoolMint),
          nonce,
        ),
        claimant: staker,
        tokenProgram: tokenProgramId,
        to: getAssociatedTokenAddressSync(new PublicKey(rewardMint), staker, false, tokenProgramId),
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
    { amount, mint, tokenProgramId = TOKEN_PROGRAM_ID, stakePool, nonce }: FundPoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const rewardProgram = this.programs.rewardPool;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const instruction = await rewardProgram.methods
      .fundPool(amount)
      .accounts({
        funder: staker,
        rewardPool: deriveRewardPoolPDA(rewardProgram.programId, new PublicKey(stakePool), new PublicKey(mint), nonce),
        from: getAssociatedTokenAddressSync(new PublicKey(mint), staker, false, tokenProgramId),
        tokenProgram: tokenProgramId,
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async createRewardEntry(data: CreateRewardEntryArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareCreateRewardEntryInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareCreateRewardEntryInstructions(
    { mint, stakePool, nonce }: CreateRewardEntryArgs,
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
        stakeEntry: deriveStakeEntryPDA(stakeProgram.programId, stakePool, staker, nonce),
        rewardPool: deriveRewardPoolPDA(rewardProgram.programId, new PublicKey(stakePool), new PublicKey(mint), nonce),
      })
      .instruction();

    return { ixs: [instruction] };
  }

  private async execute(ixs: TransactionInstruction[], extParams: IInteractSolanaExt) {
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, extParams.invoker.publicKey);

    const signature = await wrappedSignAndExecuteTransaction(
      this.connection,
      extParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      { sendThrottler: this.sendThrottler },
      this.programs,
    );

    return { signature };
  }
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
