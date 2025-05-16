import type { Connection, VersionedTransaction } from "@solana/web3.js";

import type { IInteractSolanaExt, ITransactionSolanaExtResolved, ComputeLimitEstimate } from "../types.js";
import { estimateConsumeLimit } from "../rpc/consume-limit-estimate/estimate.js";

type UnwrapAutoSimulate<T extends IInteractSolanaExt = IInteractSolanaExt> = Omit<T, "computeLimit"> & {
  skipSimulation: boolean;
  computeLimit?: ITransactionSolanaExtResolved["computeLimit"];
};
export const unwrapExecutionParams = <T extends IInteractSolanaExt>(
  { computeLimit, ...rest }: T,
  connection: Connection,
): UnwrapAutoSimulate<T> => {
  const consumeLimitFn: T["computeLimit"] =
    computeLimit === "autoSimulate"
      ? (((tx: VersionedTransaction) =>
          estimateConsumeLimit(connection, tx).then((limit) => limit.unitsConsumed ?? 0)) as ComputeLimitEstimate)
      : computeLimit;

  return { ...rest, computeLimit: consumeLimitFn, skipSimulation: computeLimit === "autoSimulate" };
};
