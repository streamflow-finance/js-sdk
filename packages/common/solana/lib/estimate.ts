import type { TransactionInstruction } from "@solana/web3.js";

import { invariant } from "../../lib/assertions.js";
import type { ComputePriceEstimate, IInteractSolanaExt, ITransactionSolanaExtResolved } from "../types.js";
import { createVersionedTransaction } from "../utils.js";
import { pk } from "./public-key.js";
import { resolveTransactionAccounts } from "./deserialize-raw-transaction.js";

const createTestTransaction = (
  ixs: Parameters<typeof createVersionedTransaction>[0],
  payer: Parameters<typeof createVersionedTransaction>[1],
  recentBlockhash?: Parameters<typeof createVersionedTransaction>[2],
  partialSigners?: Parameters<typeof createVersionedTransaction>[3],
) => {
  return createVersionedTransaction(ixs, payer, recentBlockhash ?? "11111111111111111111111111111111", partialSigners);
};

export async function estimateComputeUnitPrice(
  estimate: ComputePriceEstimate,
  testTx: ReturnType<typeof createTestTransaction>,
): Promise<number> {
  return estimate(resolveTransactionAccounts(testTx).writableAccounts);
}

export async function createAndEstimateTransaction<
  ParamsT extends ITransactionSolanaExtResolved<IInteractSolanaExt>,
  CreateFn extends (extParams: ParamsT) => Promise<TransactionInstruction[]>,
>(createFn: CreateFn, extParams: ParamsT): Promise<Awaited<ReturnType<CreateFn>>>;

export async function createAndEstimateTransaction<
  ParamsT extends ITransactionSolanaExtResolved<IInteractSolanaExt>,
  CreateFn extends (extParams: ParamsT) => Promise<any>,
>(
  createFn: CreateFn,
  extParams: ParamsT,
  select: (result: Awaited<ReturnType<CreateFn>>) => TransactionInstruction[]
): Promise<Awaited<ReturnType<CreateFn>>>;

export async function createAndEstimateTransaction<
  ParamsT extends ITransactionSolanaExtResolved<IInteractSolanaExt>,
  CreateFn extends (extParams: ParamsT) => Promise<any>,
>(
  createFn: CreateFn,
  extParams: ParamsT,
  select?: (result: Awaited<ReturnType<CreateFn>>) => TransactionInstruction[],
): Promise<Awaited<ReturnType<CreateFn>>> {
  select = select ?? ((value: Awaited<ReturnType<CreateFn>>) => value);
  const createResult = await createFn(extParams);
  const prepareIxs = select(createResult);

  const { computePrice, computeLimit } = extParams;
  const invoker = extParams.invoker.publicKey;
  invariant(invoker, "Invoker's PublicKey is not available, check passed wallet adapter!");
  const testTx = createTestTransaction(prepareIxs, pk(invoker), undefined, undefined);
  const estimatedComputeLimit = typeof computeLimit === "function" ? await computeLimit(testTx) : computeLimit;

  if (typeof computePrice !== "function") {
    if (typeof computeLimit !== "function") {
      return createResult;
    }

    return createFn({
      ...extParams,
      computeLimit: estimatedComputeLimit,
    });
  }

  const estimatedComputeUnitPrice =
    typeof computePrice === "function"
      ? await estimateComputeUnitPrice(computePrice, testTx)
      : // unachievable because we don't execute estimation for constant or undefined priority fee
        computePrice;

  return createFn({
    ...extParams,
    computePrice: estimatedComputeUnitPrice,
    computeLimit: estimatedComputeLimit,
  });
}
