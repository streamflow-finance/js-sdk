import { Buffer } from "buffer";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { ata, checkOrCreateAtaBatch, getBN, getMintAndProgram, prepareWrappedAccount } from "@streamflow/common";

import {
  STREAMFLOW_TREASURY_PUBLIC_KEY,
  WITHDRAWOR_PUBLIC_KEY,
  FEE_ORACLE_PUBLIC_KEY,
  DEFAULT_STREAMFLOW_FEE,
  PARTNERS_SCHEMA,
  ALIGNED_PRECISION_FACTOR_POW,
} from "../constants";
import type { StreamflowAlignedUnlocks as AlignedUnlocksProgramType } from "../descriptor/streamflow_aligned_unlocks";
import StreamflowAlignedUnlocksIDL from "../descriptor/idl/streamflow_aligned_unlocks.json";
import { createStreamInstruction, createStreamV2Instruction } from "../instructions";
import { deriveEscrowPDA, deriveStreamMetadataPDA, deriveTestOraclePDA } from "../lib/derive-accounts";
import { calculateTotalAmountToDeposit } from "../lib/utils";
import type { ICreateAlignedStreamData, ICreateStreamData, OracleType } from "../types";
import type { CreateInstructionResult, Env, NativeOptions } from "./types";
import { resolveConnection } from "./types";

function isCreateAlignedStreamDataLocal(params: ICreateStreamData): params is ICreateAlignedStreamData {
  return "minPrice" in params && "maxPrice" in params;
}

async function getTotalFee(
  connection: Parameters<typeof getMintAndProgram>[0],
  partnerAddress: string,
): Promise<number> {
  const feeOraclePublicKey = new PublicKey(FEE_ORACLE_PUBLIC_KEY.Mainnet);
  const data = await connection.getAccountInfo(feeOraclePublicKey);
  if (!data) {
    return DEFAULT_STREAMFLOW_FEE;
  }
  const { borsh } = await import("@coral-xyz/borsh");
  const partners = borsh.deserialize(PARTNERS_SCHEMA, data.data) as unknown as Array<{
    pubkey: Uint8Array;
    creation_fee: number;
    auto_claim_fee: number;
    token_fee_percent: number;
  }>;
  const filteredPartners = partners.filter((partner) => new PublicKey(partner.pubkey).toString() === partnerAddress);
  if (filteredPartners.length === 0) {
    return DEFAULT_STREAMFLOW_FEE;
  }
  return Number(filteredPartners[0]!.token_fee_percent.toFixed(4));
}

export async function create(
  params: ICreateStreamData,
  sender: PublicKey,
  env: Env & NativeOptions,
): Promise<CreateInstructionResult> {
  const connection = resolveConnection(env);
  const { isNative = false } = env;
  const { partner, amount, tokenProgramId: streamTokenProgramId } = params;
  const partnerPublicKey = partner ? new PublicKey(partner) : sender;
  const mintPublicKey = isNative ? NATIVE_MINT : new PublicKey(params.tokenId);

  const instructions: Awaited<ReturnType<typeof createStreamInstruction>>[] = [];
  const signers: Keypair[] = [];

  let tokenProgramId: PublicKey;
  if (streamTokenProgramId) {
    tokenProgramId = new PublicKey(streamTokenProgramId);
  } else {
    tokenProgramId = (await getMintAndProgram(connection, mintPublicKey)).tokenProgramId;
  }

  const partnerAtaIxs = await checkOrCreateAtaBatch(
    connection,
    [partnerPublicKey],
    mintPublicKey,
    { publicKey: sender },
    tokenProgramId,
  );
  instructions.push(...partnerAtaIxs);

  if (isNative) {
    const totalFee = await getTotalFee(connection, partnerPublicKey.toString());
    const totalAmount = calculateTotalAmountToDeposit(amount, totalFee);
    instructions.push(...(await prepareWrappedAccount(connection, sender, totalAmount)));
  }

  if (isCreateAlignedStreamDataLocal(params)) {
    const result = await buildAlignedInstructions(params, sender, mintPublicKey, connection, tokenProgramId);
    instructions.push(...result.instructions);
    signers.push(...result.signers);
    return {
      instructions,
      signers: signers.length > 0 ? signers : undefined,
      metadata: result.metadata,
      metadataPubKey: result.metadataPubKey,
    };
  }

  const result = await buildLinearInstructions(params, sender, mintPublicKey, connection, tokenProgramId, env);
  instructions.push(...result.instructions);
  if (result.signers) {
    signers.push(...result.signers);
  }
  return {
    instructions,
    signers: signers.length > 0 ? signers : undefined,
    metadata: result.metadata,
    metadataPubKey: result.metadataPubKey,
  };
}

async function buildLinearInstructions(
  params: ICreateStreamData,
  sender: PublicKey,
  mintPublicKey: PublicKey,
  connection: Parameters<typeof getMintAndProgram>[0],
  tokenProgramId: PublicKey,
  env: NativeOptions,
): Promise<{
  instructions: Awaited<ReturnType<typeof createStreamInstruction>>[];
  signers?: Keypair[];
  metadata?: Keypair;
  metadataPubKey: PublicKey;
}> {
  const {
    recipient,
    tokenId: mint,
    start,
    amount: depositedAmount,
    period,
    cliff,
    cliffAmount,
    amountPerPeriod,
    name,
    canPause,
    canUpdateRate,
    canTopup,
    cancelableBySender,
    cancelableByRecipient,
    transferableBySender,
    transferableByRecipient,
    automaticWithdrawal = false,
    withdrawalFrequency = 0,
    nonce,
  } = params;

  const recipientPublicKey = new PublicKey(recipient);
  let metadata: Keypair | undefined;
  let metadataPubKey: PublicKey;

  if (nonce != null) {
    metadataPubKey = deriveStreamMetadataPDA(env.programId, mintPublicKey, sender, nonce);
  } else {
    metadata = Keypair.generate();
    metadataPubKey = metadata.publicKey;
  }

  const escrowTokens = PublicKey.findProgramAddressSync(
    [Buffer.from("strm"), metadataPubKey.toBuffer()],
    env.programId,
  )[0];

  const senderTokens = await ata(mintPublicKey, sender, tokenProgramId);
  const recipientTokens = await ata(mintPublicKey, recipientPublicKey, tokenProgramId);
  const streamflowTreasuryTokens = await ata(mintPublicKey, STREAMFLOW_TREASURY_PUBLIC_KEY, tokenProgramId);
  const partnerPublicKey = params.partner ? new PublicKey(params.partner) : sender;
  const partnerTokens = await ata(mintPublicKey, partnerPublicKey, tokenProgramId);

  const accounts = {
    sender,
    senderTokens,
    recipient: recipientPublicKey,
    metadata: metadataPubKey,
    escrowTokens,
    recipientTokens,
    streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
    streamflowTreasuryTokens,
    partner: partnerPublicKey,
    partnerTokens,
    mint: new PublicKey(mint),
    feeOracle: new PublicKey(FEE_ORACLE_PUBLIC_KEY.Mainnet),
    rent: SYSVAR_RENT_PUBKEY,
    timelockProgram: env.programId,
    tokenProgram: tokenProgramId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    withdrawor: WITHDRAWOR_PUBLIC_KEY,
    systemProgram: SystemProgram.programId,
  };

  const baseData = {
    start: new BN(start),
    depositedAmount,
    period: new BN(period),
    amountPerPeriod,
    cliff: new BN(cliff),
    cliffAmount: new BN(cliffAmount),
    cancelableBySender,
    cancelableByRecipient,
    automaticWithdrawal,
    transferableBySender,
    transferableByRecipient,
    canTopup,
    canUpdateRate: !!canUpdateRate,
    canPause: !!canPause,
    name,
    withdrawFrequency: new BN(automaticWithdrawal ? withdrawalFrequency : period),
  };

  const ixs: Awaited<ReturnType<typeof createStreamInstruction>>[] = [];

  if (nonce != null) {
    ixs.push(await createStreamV2Instruction({ ...baseData, nonce }, env.programId, accounts));
  } else {
    ixs.push(await createStreamInstruction(baseData, env.programId, accounts));
  }

  return {
    instructions: ixs,
    signers: metadata ? [metadata] : undefined,
    metadata,
    metadataPubKey,
  };
}

async function buildAlignedInstructions(
  params: ICreateAlignedStreamData,
  sender: PublicKey,
  mintPublicKey: PublicKey,
  connection: Parameters<typeof getMintAndProgram>[0],
  tokenProgramId: PublicKey,
): Promise<{
  instructions: Awaited<ReturnType<typeof createStreamInstruction>>[];
  signers: Keypair[];
  metadata: Keypair;
  metadataPubKey: PublicKey;
}> {
  const {
    start,
    period,
    cliff,
    canTopup,
    cancelableBySender,
    cancelableByRecipient,
    transferableBySender,
    transferableByRecipient,
    partner,
    recipient,
    cliffAmount,
    amountPerPeriod,
    amount: depositedAmount,
    name: streamName,
    minPrice,
    maxPercentage,
    minPercentage,
    maxPrice,
    skipInitial,
    tickSize,
    priceOracle,
    oracleType,
    expiryTime,
    expiryPercentage,
    floorPrice,
  } = params;

  const recipientPublicKey = new PublicKey(recipient);
  const partnerPublicKey = partner ? new PublicKey(partner) : sender;

  const metadata = Keypair.generate();
  const metadataPubKey = metadata.publicKey;

  const escrowPDA = deriveEscrowPDA(new PublicKey(env.programId), metadataPubKey);

  const alignedProxyProgram = createAlignedProxyProgram(connection);

  const oracle = priceOracle ?? deriveTestOraclePDA(alignedProxyProgram.programId, mintPublicKey, sender);

  const recipientAtaIxs = await checkOrCreateAtaBatch(
    connection,
    [recipientPublicKey],
    mintPublicKey,
    { publicKey: sender },
    tokenProgramId,
  );

  const encodedUIntArray = new TextEncoder().encode(streamName);
  const streamNameArray = Array.from(encodedUIntArray);

  const createIx = await alignedProxyProgram.methods
    .create({
      startTime: new BN(start),
      netAmountDeposited: depositedAmount,
      period: new BN(period),
      amountPerPeriod: amountPerPeriod,
      cliff: new BN(cliff),
      cliffAmount: cliffAmount,
      transferableBySender,
      transferableByRecipient,
      cancelableByRecipient,
      cancelableBySender,
      canTopup,
      oracleType: (!!oracleType ? { [oracleType]: {} } : { none: {} }) as OracleType,
      streamName: streamNameArray,
      minPrice: typeof minPrice === "number" ? getBN(minPrice, ALIGNED_PRECISION_FACTOR_POW) : minPrice,
      maxPrice: typeof maxPrice === "number" ? getBN(maxPrice, ALIGNED_PRECISION_FACTOR_POW) : maxPrice,
      minPercentage:
        typeof minPercentage === "number" ? getBN(minPercentage, ALIGNED_PRECISION_FACTOR_POW) : minPercentage,
      maxPercentage:
        typeof maxPercentage === "number" ? getBN(maxPercentage, ALIGNED_PRECISION_FACTOR_POW) : maxPercentage,
      tickSize: new BN(tickSize || 1),
      skipInitial: skipInitial ?? false,
      expiryTime: new BN(expiryTime ?? 0),
      expiryPercentage:
        typeof expiryPercentage === "number"
          ? getBN(expiryPercentage, ALIGNED_PRECISION_FACTOR_POW)
          : expiryPercentage ?? new BN(0),
      floorPrice:
        typeof floorPrice === "number" ? getBN(floorPrice, ALIGNED_PRECISION_FACTOR_POW) : floorPrice ?? new BN(0),
    })
    .accountsPartial({
      payer: sender,
      sender: sender,
      streamMetadata: metadataPubKey,
      escrowTokens: escrowPDA,
      mint: mintPublicKey,
      partner: partnerPublicKey,
      recipient: recipientPublicKey,
      withdrawor: WITHDRAWOR_PUBLIC_KEY,
      feeOracle: new PublicKey(FEE_ORACLE_PUBLIC_KEY.Mainnet),
      priceOracle: oracle,
      tokenProgram: tokenProgramId,
      streamflowProgram: env.programId,
    })
    .instruction();

  return {
    instructions: [...recipientAtaIxs, createIx],
    signers: [metadata],
    metadata,
    metadataPubKey,
  };
}

function createAlignedProxyProgram(
  connection: Parameters<typeof getMintAndProgram>[0],
): Program<AlignedUnlocksProgramType> {
  const alignedUnlocksProgram = {
    ...StreamflowAlignedUnlocksIDL,
    address: StreamflowAlignedUnlocksIDL.address,
  } as AlignedUnlocksProgramType;
  return new Program(alignedUnlocksProgram, { connection });
}
