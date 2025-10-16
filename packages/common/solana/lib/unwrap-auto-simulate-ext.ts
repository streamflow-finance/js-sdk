import type { Connection, VersionedTransaction } from "@solana/web3.js";

import type { IInteractExt, ITransactionExtResolved, ComputeLimitEstimate } from "../types.js";
import { estimateConsumeLimit } from "../rpc/consume-limit-estimate/estimate.js";

type UnwrapAutoSimulate<T extends IInteractExt = IInteractExt> = Omit<T, "computeLimit"> & {
  skipSimulation: boolean;
  computeLimit?: ITransactionExtResolved["computeLimit"];
};
export const unwrapExecutionParams = <T extends IInteractExt>(
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
