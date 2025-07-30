import type { AccountsCoder, AnchorError, Idl, IdlAccounts, ProgramAccount, ProgramError } from "@coral-xyz/anchor";
import { Program, parseIdlErrors, translateError } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  type Commitment,
  Connection,
  type ConnectionConfig,
  PublicKey,
  type TransactionInstruction,
} from "@solana/web3.js";
import { ContractError, ICluster, type ITransactionResult, invariant } from "@streamflow/common";
import {
  buildSendThrottler,
  checkOrCreateAtaBatch,
  createAndEstimateTransaction,
  getFilters,
  pk,
  prepareBaseInstructions,
  prepareTransaction,
  signAndExecuteTransaction,
  unwrapExecutionParams,
} from "@streamflow/common/solana";
import type PQueue from "p-queue";

import {
  REWARD_ENTRY_BYTE_OFFSETS,
  REWARD_POOL_BYTE_OFFSETS,
  REWARD_POOL_DYNAMIC_PROGRAM_ID,
  REWARD_POOL_PROGRAM_ID,
  STAKE_ENTRY_BYTE_OFFSETS,
  STAKE_POOL_BYTE_OFFSETS,
  STAKE_POOL_PROGRAM_ID,
  STREAMFLOW_TREASURY_PUBLIC_KEY,
} from "./constants.js";
import { type FeeManager as FeeManagerProgramType } from "./descriptor/fee_manager.js";
import FeeManagerIDL from "./descriptor/idl/fee_manager.json";
import RewardPoolIDL from "./descriptor/idl/reward_pool.json";
import RewardPoolDynamicIDL from "./descriptor/idl/reward_pool_dynamic.json";
import StakePoolIDL from "./descriptor/idl/stake_pool.json";
import { type RewardPool as RewardPoolProgramType } from "./descriptor/reward_pool.js";
import { type RewardPoolDynamic as RewardPoolDynamicProgramType } from "./descriptor/reward_pool_dynamic.js";
import { type StakePool as StakePoolProgramType } from "./descriptor/stake_pool.js";
import {
  deriveConfigPDA,
  deriveFeeValuePDA,
  deriveRewardPoolPDA,
  deriveRewardVaultPDA,
  deriveStakeEntryPDA,
  deriveStakeMintPDA,
  deriveStakePoolPDA,
} from "./lib/derive-accounts.js";
import type {
  ClaimRewardPoolArgs,
  CloseRewardEntryArgs,
  CloseStakeEntryArgs,
  CreateRewardEntryArgs,
  CreateRewardPoolArgs,
  CreateStakePoolArgs,
  DefaultFeeValueConfig,
  FeeValue,
  FundPoolArgs,
  IInteractSolanaExt,
  RewardEntry,
  RewardPool,
  StakeAndCreateEntriesArgs,
  StakeArgs,
  StakeEntry,
  StakePool,
  UnstakeAndClaimArgs,
  UnstakeAndCloseArgs,
  UnstakeArgs,
  UpdateRewardPoolArgs,
} from "./types.js";

interface Programs {
  stakePoolProgram: Program<StakePoolProgramType>;
  rewardPoolProgram: Program<RewardPoolProgramType>;
  rewardPoolDynamicProgram: Program<RewardPoolDynamicProgramType>;
  feeManagerProgram: Program<FeeManagerProgramType>;
}

type CreationResult = ITransactionResult & { metadataId: PublicKey };

interface IInitOptions {
  clusterUrl: string;
  cluster?: ICluster;
  commitment?: Commitment | ConnectionConfig;
  programIds?: {
    stakePool?: string;
    rewardPool?: string;
    rewardPoolDynamic?: string;
    feeManager?: string;
  };
  sendRate?: number;
  sendThrottler?: PQueue;
}

export class SolanaStakingClient {
  connection: Connection;

  private readonly cluster: ICluster;

  private readonly commitment: Commitment | ConnectionConfig;

  private readonly sendThrottler: PQueue;

  public readonly programs: Programs;

  constructor({
    clusterUrl,
    cluster = ICluster.Mainnet,
    commitment = "confirmed",
    programIds,
    sendRate = 1,
    sendThrottler,
  }: IInitOptions) {
    this.cluster = cluster;
    this.commitment = commitment;
    this.connection = new Connection(clusterUrl, this.commitment);
    this.sendThrottler = sendThrottler ?? buildSendThrottler(sendRate);
    const stakePoolIdl = {
      ...StakePoolIDL,
      address: programIds?.stakePool ?? STAKE_POOL_PROGRAM_ID[cluster] ?? StakePoolIDL.address,
    } as StakePoolProgramType;
    const rewardPoolIdl = {
      ...RewardPoolIDL,
      address: programIds?.rewardPool ?? REWARD_POOL_PROGRAM_ID[cluster] ?? RewardPoolIDL.address,
    } as RewardPoolProgramType;
    const rewardPoolDynamicIdl = {
      ...RewardPoolDynamicIDL,
      address: programIds?.rewardPool ?? REWARD_POOL_DYNAMIC_PROGRAM_ID[cluster] ?? RewardPoolDynamicIDL.address,
    } as RewardPoolDynamicProgramType;
    const feeManagerIdl = {
      ...FeeManagerIDL,
      address: programIds?.feeManager ?? FeeManagerIDL.address,
    } as FeeManagerProgramType;
    this.programs = {
      stakePoolProgram: new Program(stakePoolIdl, {
        connection: this.connection,
      }) as Program<StakePoolProgramType>,
      rewardPoolProgram: new Program(rewardPoolIdl, {
        connection: this.connection,
      }) as Program<RewardPoolProgramType>,
      rewardPoolDynamicProgram: new Program(rewardPoolDynamicIdl, {
        connection: this.connection,
      }) as Program<RewardPoolDynamicProgramType>,
      feeManagerProgram: new Program(feeManagerIdl, {
        connection: this.connection,
      }) as Program<FeeManagerProgramType>,
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

  async getStakePool(id: string | PublicKey): Promise<StakePool> {
    const { stakePoolProgram } = this.programs;
    return stakePoolProgram.account.stakePool.fetch(id);
  }

  async searchStakePools(
    criteria: Partial<Pick<StakePool, keyof typeof STAKE_POOL_BYTE_OFFSETS>> = {},
  ): Promise<ProgramAccount<StakePool>[]> {
    const { stakePoolProgram } = this.programs;
    return stakePoolProgram.account.stakePool.all(getFilters(criteria, STAKE_POOL_BYTE_OFFSETS));
  }

  async getStakeEntry(id: string | PublicKey): Promise<StakeEntry | null> {
    const { stakePoolProgram } = this.programs;
    return stakePoolProgram.account.stakeEntry.fetch(id);
  }

  async searchStakeEntries(
    criteria: Partial<Pick<StakeEntry, keyof typeof STAKE_ENTRY_BYTE_OFFSETS>> = {},
  ): Promise<ProgramAccount<StakeEntry>[]> {
    const { stakePoolProgram } = this.programs;
    return stakePoolProgram.account.stakeEntry.all(getFilters(criteria, STAKE_ENTRY_BYTE_OFFSETS));
  }

  async searchRewardPools(
    criteria: Partial<Pick<RewardPool, "stakePool" | "mint">> = {},
  ): Promise<ProgramAccount<RewardPool>[]> {
    const { rewardPoolProgram } = this.programs;
    return rewardPoolProgram.account.rewardPool.all(getFilters(criteria, REWARD_POOL_BYTE_OFFSETS));
  }

  async searchRewardEntries(
    criteria: Partial<Pick<RewardEntry, keyof typeof REWARD_ENTRY_BYTE_OFFSETS>>,
  ): Promise<ProgramAccount<RewardEntry>[]> {
    const { rewardPoolProgram } = this.programs;
    return rewardPoolProgram.account.rewardEntry.all(getFilters(criteria, REWARD_ENTRY_BYTE_OFFSETS));
  }

  async getFee(target: string | PublicKey): Promise<FeeValue | DefaultFeeValueConfig> {
    const perTargetFee = await this.getFeeValueIfExists(target);
    if (perTargetFee) {
      return perTargetFee;
    }
    return this.getDefaultFeeValue();
  }

  getDefaultFeeValue(): Promise<DefaultFeeValueConfig> {
    const { feeManagerProgram } = this.programs;
    const feeValueKey = deriveConfigPDA(feeManagerProgram.programId);
    return feeManagerProgram.account.config.fetch(feeValueKey);
  }

  getFeeValueIfExists(target: string | PublicKey): Promise<FeeValue | null> {
    const { feeManagerProgram } = this.programs;
    const feeValueKey = deriveFeeValuePDA(feeManagerProgram.programId, new PublicKey(target));
    return feeManagerProgram.account.feeValue.fetchNullable(feeValueKey);
  }

  async createStakePool(data: CreateStakePoolArgs, extParams: IInteractSolanaExt): Promise<CreationResult> {
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
      freezeStakeMint = null,
      unstakePeriod = null,
      nonce,
      tokenProgramId = TOKEN_PROGRAM_ID,
    }: CreateStakePoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const { stakePoolProgram } = this.programs;
    const creator = extParams.invoker.publicKey;
    invariant(creator, "Undefined invoker publicKey");
    const createInstruction = await stakePoolProgram.methods
      .createPool(nonce, maxWeight, minDuration, maxDuration, permissionless, freezeStakeMint, unstakePeriod)
      .accounts({
        creator,
        mint,
        tokenProgram: tokenProgramId,
      })
      .instruction();

    const stakePoolPDA = deriveStakePoolPDA(stakePoolProgram.programId, pk(mint), creator, nonce);

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

  /**
   * Stake into a Pool and creates Reward Entries to track rewards.
   *
   * Resulting transaction may bee too large for execution if there are too many reward pools.
   *
   * @param data - enriched stake params with an array of reward pools
   * @param extParams - parameter required for transaction execution
   */
  async stakeAndCreateEntries(
    data: StakeAndCreateEntriesArgs,
    extParams: IInteractSolanaExt,
  ): Promise<ITransactionResult> {
    const { ixs } = await this.prepareStakeAndCreateEntriesInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareStakeAndCreateEntriesInstructions(
    data: StakeAndCreateEntriesArgs,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const ixs = await Promise.all([
      this.prepareStakeInstructions(data, extParams).then(({ ixs }) => ixs),
      ...data.rewardPools.map((params) =>
        this.prepareCreateRewardEntryInstructions(
          {
            stakePool: data.stakePool,
            stakePoolMint: data.stakePoolMint,
            depositNonce: data.nonce,
            rewardPoolNonce: params.nonce,
            rewardMint: params.mint,
            tokenProgramId: params.tokenProgramId,
            rewardPoolType: params.rewardPoolType,
          },
          extParams,
        ).then(({ ixs }) => ixs),
      ),
    ]).then((ixs) => ixs.flat());

    return { ixs };
  }

  async prepareStakeInstructions(
    { nonce, amount, duration, stakePool, stakePoolMint, tokenProgramId = TOKEN_PROGRAM_ID }: StakeArgs,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const { stakePoolProgram } = this.programs;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const mint = deriveStakeMintPDA(stakePoolProgram.programId, pk(stakePool));
    const stakeMintAccountKey = getAssociatedTokenAddressSync(mint, staker, true, pk(tokenProgramId));
    const poolMintAccountKey = getAssociatedTokenAddressSync(pk(stakePoolMint), staker, true, pk(tokenProgramId));
    const instruction = await stakePoolProgram.methods
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

  async unstake(data: UnstakeArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareUnstakeInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  /**
   * Unstake from a pool, claiming all rewards prior to that.
   *
   * Resulting transaction may be too large for execution if there are too many reward pools.
   *
   * @param data - enriched unstake args with reward pools
   * @param extParams - parameter required for transaction execution
   */
  async unstakeAndClaim(data: UnstakeAndClaimArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareUnstakeAndClaimInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareUnstakeAndClaimInstructions(
    data: UnstakeAndClaimArgs,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const ixs = await Promise.all([
      ...data.rewardPools.map((params) =>
        this.prepareClaimRewardsInstructions(
          {
            stakePool: data.stakePool,
            stakePoolMint: data.stakePoolMint,
            depositNonce: data.nonce,
            rewardPoolNonce: params.nonce,
            rewardMint: params.mint,
            tokenProgramId: params.tokenProgramId,
            rewardPoolType: params.rewardPoolType,
            governor: params.governor,
            vote: params.vote,
          },
          extParams,
        ).then(({ ixs }) => ixs),
      ),
      this.prepareUnstakeAndCloseInstructions(data, extParams).then(({ ixs }) => ixs),
    ]).then((ixs) => ixs.flat());

    return { ixs };
  }

  /**
   * Unstake from a pool, closing all related stake and reward entries.
   *
   * REWARDS WON'T be claimed - use this call only if user can't unstake with rewards claims, i.e. when reward pool is drained.
   *
   * Resulting transaction may be too large for execution if there are too many reward pools.
   *
   * @param data - enriched unstake args with reward pools
   * @param extParams - parameter required for transaction execution
   */
  async unstakeAndClose(data: UnstakeAndCloseArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareUnstakeAndCloseInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareUnstakeAndCloseInstructions(
    data: UnstakeAndCloseArgs,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const ixs = await Promise.all([
      this.prepareUnstakeInstructions({ ...data, shouldClose: true }, extParams).then(({ ixs }) => ixs),
      ...data.rewardPools.map((params) =>
        this.prepareCloseRewardEntryInstructions(
          {
            stakePool: data.stakePool,
            stakePoolMint: data.stakePoolMint,
            depositNonce: data.nonce,
            rewardPoolNonce: params.nonce,
            rewardMint: params.mint,
            tokenProgramId: params.tokenProgramId,
            rewardPoolType: params.rewardPoolType,
          },
          extParams,
        ).then(({ ixs }) => ixs),
      ),
    ]).then((ixs) => ixs.flat());

    return { ixs };
  }

  async prepareUnstakeInstructions(
    { stakePool, stakePoolMint, nonce, tokenProgramId = TOKEN_PROGRAM_ID, shouldClose = false }: UnstakeArgs,
    extParams: IInteractSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
  }> {
    const { stakePoolProgram } = this.programs;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const stakeMintKey = deriveStakeMintPDA(stakePoolProgram.programId, pk(stakePool));
    const stakeEntryKey = deriveStakeEntryPDA(stakePoolProgram.programId, pk(stakePool), staker, nonce);
    const poolMintAccountKey = getAssociatedTokenAddressSync(pk(stakePoolMint), staker, true, pk(tokenProgramId));
    const stakeMintAccountKey = getAssociatedTokenAddressSync(stakeMintKey, staker, true, pk(tokenProgramId));
    const instruction = await stakePoolProgram.methods
      .unstake(shouldClose)
      .accounts({
        stakeEntry: stakeEntryKey,
        to: poolMintAccountKey,
        from: stakeMintAccountKey,
        authority: staker,
        tokenProgram: tokenProgramId,
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async closeStakeEntry(data: CloseStakeEntryArgs, extParams: IInteractSolanaExt) {
    const { ixs } = await this.prepareCloseStakeEntryInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareCloseStakeEntryInstructions({ stakePool, nonce }: CloseStakeEntryArgs, extParams: IInteractSolanaExt) {
    const { stakePoolProgram } = this.programs;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const stakeEntryKey = deriveStakeEntryPDA(stakePoolProgram.programId, pk(stakePool), staker, nonce);
    const instruction = await stakePoolProgram.methods
      .closeEntry()
      .accounts({
        stakeEntry: stakeEntryKey,
        authority: staker,
      })
      .instruction();
    return { ixs: [instruction] };
  }

  async createRewardPool(data: CreateRewardPoolArgs, extParams: IInteractSolanaExt): Promise<CreationResult> {
    const { ixs, publicKey } = await this.prepareCreateRewardPoolInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
      metadataId: publicKey,
    };
  }

  async prepareCreateRewardPoolInstructions(
    {
      nonce,
      rewardAmount,
      rewardPeriod,
      rewardMint,
      permissionless = false,
      stakePool,
      lastClaimPeriodOpt,
      tokenProgramId = TOKEN_PROGRAM_ID,
    }: CreateRewardPoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const { rewardPoolProgram } = this.programs;
    const creator = extParams.invoker.publicKey;
    invariant(creator, "Undefined invoker publicKey");
    const instruction = await rewardPoolProgram.methods
      .createPool(nonce, rewardAmount, rewardPeriod, permissionless, lastClaimPeriodOpt)
      .accounts({
        creator,
        stakePool,
        mint: rewardMint,
        tokenProgram: tokenProgramId,
      })
      .instruction();

    const rewardPoolKey = deriveRewardPoolPDA(rewardPoolProgram.programId, pk(stakePool), pk(rewardMint), nonce);

    return { publicKey: rewardPoolKey, ixs: [instruction] };
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
    {
      rewardPoolNonce,
      depositNonce,
      stakePool,
      tokenProgramId = TOKEN_PROGRAM_ID,
      rewardMint,
      rewardPoolType = "fixed",
      governor,
      vote,
    }: ClaimRewardPoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const rewardPoolProgram = this.getRewardProgram(rewardPoolType);
    const { stakePoolProgram } = this.programs;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const rewardPoolKey = deriveRewardPoolPDA(
      rewardPoolProgram.programId,
      pk(stakePool),
      pk(rewardMint),
      rewardPoolNonce,
    );
    let ixBuilder = rewardPoolProgram.methods.claimRewards().accounts({
      stakeEntry: deriveStakeEntryPDA(stakePoolProgram.programId, pk(stakePool), staker, depositNonce),
      rewardPool: rewardPoolKey,
      claimant: staker,
      tokenProgram: tokenProgramId,
      to: getAssociatedTokenAddressSync(pk(rewardMint), staker, true, pk(tokenProgramId)),
    });

    if (this.isDynamicRewardProgram(rewardPoolProgram)) {
      if (governor === undefined) {
        governor = (await rewardPoolProgram.account.rewardPool.fetch(rewardPoolKey)).governor;
      }
      // @ts-expect-error
      ixBuilder = ixBuilder.accountsPartial({ governor, vote: vote ?? null });
    }

    return { ixs: [await ixBuilder.instruction()] };
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
    {
      amount,
      tokenProgramId = TOKEN_PROGRAM_ID,
      rewardMint,
      stakePool,
      feeValue,
      nonce,
      rewardPoolType = "fixed",
    }: FundPoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const rewardPoolProgram = this.getRewardProgram(rewardPoolType);
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const existingFee = await this.getFeeValueIfExists(staker);
    const rewardMintPk = pk(rewardMint);
    const tokenProgramPk = pk(tokenProgramId);
    const treasuryATA =
      !existingFee || existingFee.streamflowFee.gtn(0)
        ? await checkOrCreateAtaBatch(
            this.connection,
            [STREAMFLOW_TREASURY_PUBLIC_KEY],
            rewardMintPk,
            extParams.invoker,
            tokenProgramPk,
          )
        : null;
    const rewardPoolPda = deriveRewardPoolPDA(rewardPoolProgram.programId, pk(stakePool), rewardMintPk, nonce);
    const instruction = await rewardPoolProgram.methods
      .fundPool(amount)
      .accountsPartial({
        funder: staker,
        rewardPool: rewardPoolPda,
        from: getAssociatedTokenAddressSync(rewardMintPk, staker, true, tokenProgramPk),
        tokenProgram: tokenProgramId,
        vault: deriveRewardVaultPDA(rewardPoolProgram.programId, rewardPoolPda),
        mint: rewardMint,
        feeValue,
      })
      .instruction();

    return { ixs: treasuryATA ? treasuryATA.concat([instruction]) : [instruction] };
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
    { stakePool, rewardPoolNonce, depositNonce, rewardMint, rewardPoolType = "fixed" }: CreateRewardEntryArgs,
    extParams: IInteractSolanaExt,
  ) {
    const rewardPoolProgram = this.getRewardProgram(rewardPoolType);
    const { stakePoolProgram } = this.programs;
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const instruction = await rewardPoolProgram.methods
      .createEntry()
      .accounts({
        payer: staker,
        authority: staker,
        stakeEntry: deriveStakeEntryPDA(stakePoolProgram.programId, pk(stakePool), staker, depositNonce),
        rewardPool: deriveRewardPoolPDA(rewardPoolProgram.programId, pk(stakePool), pk(rewardMint), rewardPoolNonce),
      })
      .accountsPartial({
        stakePool,
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async closeRewardEntry(data: CloseRewardEntryArgs, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const { ixs } = await this.prepareCloseRewardEntryInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareCloseRewardEntryInstructions(
    { stakePool, rewardPoolNonce, depositNonce, rewardMint, rewardPoolType = "fixed" }: CreateRewardEntryArgs,
    extParams: IInteractSolanaExt,
  ) {
    const rewardPoolProgram = this.getRewardProgram(rewardPoolType);
    const staker = extParams.invoker.publicKey;
    invariant(staker, "Undefined invoker publicKey");
    const instruction = await rewardPoolProgram.methods
      .closeEntry(depositNonce)
      .accounts({
        authority: staker,
        rewardPool: deriveRewardPoolPDA(rewardPoolProgram.programId, pk(stakePool), pk(rewardMint), rewardPoolNonce),
      })
      .instruction();

    return { ixs: [instruction] };
  }

  async updateRewardPool(data: UpdateRewardPoolArgs, extParams: IInteractSolanaExt) {
    const { ixs } = await this.prepareUpdateRewardPoolInstructions(data, extParams);
    const { signature } = await this.execute(ixs, extParams);

    return {
      ixs,
      txId: signature,
    };
  }

  async prepareUpdateRewardPoolInstructions(
    { rewardPool, rewardAmount, rewardPeriod, stakePool }: UpdateRewardPoolArgs,
    extParams: IInteractSolanaExt,
  ) {
    const { rewardPoolProgram } = this.programs;
    const invoker = extParams.invoker.publicKey;
    invariant(invoker, "Undefined invoker publicKey");
    const instruction = await rewardPoolProgram.methods
      .updatePool(rewardAmount, rewardPeriod)
      .accountsPartial({
        stakePool,
        authority: invoker,
        rewardPool,
      })
      .instruction();

    return { ixs: [instruction] };
  }

  decode<
    ProgramName extends keyof Programs = keyof Programs,
    DecodingProgram = Programs[ProgramName],
    DerivedIdl extends Idl = DecodingProgram extends Program<infer IDLType> ? IDLType : never,
    AccountName extends keyof IdlAccounts<DerivedIdl> = keyof IdlAccounts<DerivedIdl>,
    DecodedAccount = IdlAccounts<DerivedIdl>[AccountName],
  >(
    programKey: ProgramName,
    accountName: AccountName,
    accInfo: Parameters<AccountsCoder["decode"]>[1],
  ): DecodedAccount {
    const decodingProgram = this.programs[programKey];
    invariant(decodingProgram, `Decoding program with key ${programKey} is not available`);
    return decodingProgram.coder.accounts.decode(accountName.toString(), accInfo);
  }

  getDiscriminator<
    ProgramName extends keyof Programs = keyof Programs,
    DecodingProgram = Programs[ProgramName],
    DerivedIdl extends Idl = DecodingProgram extends Program<infer IDLType> ? IDLType : never,
    AccountName extends keyof IdlAccounts<DerivedIdl> = keyof IdlAccounts<DerivedIdl>,
  >(programKey: ProgramName, accountName: AccountName): number[] {
    const decodingProgram = this.programs[programKey];
    invariant(decodingProgram, `Decoding program with key ${programKey} is not available`);
    const accountEntity = decodingProgram.idl.accounts.find((acc) => acc.name === accountName);
    invariant(
      accountEntity,
      `Decoding program with key ${programKey} doesn't specify account with name ${accountName.toString()}`,
    );
    return accountEntity.discriminator;
  }

  async execute(ixs: TransactionInstruction[], extParams: IInteractSolanaExt) {
    const executionParams = unwrapExecutionParams(extParams, this.connection);

    ixs = await createAndEstimateTransaction(
      async (params) => prepareBaseInstructions(this.connection, params).concat(ixs),
      executionParams,
    );

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
        { sendThrottler: this.sendThrottler, skipSimulation: executionParams.skipSimulation },
      );
      return { signature };
    } catch (err: unknown) {
      if (err instanceof Error) {
        const parsed: AnchorError | ProgramError | typeof err = translateError(
          err,
          parseIdlErrors(this.programs.stakePoolProgram.idl), // TODO how to catch an error from a specific program?
        );
        if (parsed) {
          throw new ContractError(err, parsed.name, parsed.message);
        }
      }
      throw err;
    }
  }

  private getRewardProgram(type: "fixed"): Program<RewardPoolProgramType>;
  private getRewardProgram(type: "dynamic"): Program<RewardPoolDynamicProgramType>;
  private getRewardProgram(
    type: "fixed" | "dynamic",
  ): Program<RewardPoolProgramType> | Program<RewardPoolDynamicProgramType>;
  private getRewardProgram(
    type: "fixed" | "dynamic",
  ): Program<RewardPoolProgramType> | Program<RewardPoolDynamicProgramType> {
    if (type === "dynamic") {
      return this.programs.rewardPoolDynamicProgram;
    } else {
      return this.programs.rewardPoolProgram;
    }
  }

  private isDynamicRewardProgram = (
    program: Program<RewardPoolProgramType> | Program<RewardPoolDynamicProgramType>,
  ): program is Program<RewardPoolDynamicProgramType> => {
    return program.programId.equals(this.programs.rewardPoolDynamicProgram.programId);
  };
}
