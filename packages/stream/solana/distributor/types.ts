import BN from "bn.js";

import { ITransactionResult } from "../../common/types";

export interface ICreateDistributorData {
  mint: string;
  version: number;

  root: Array<number>;
  maxTotalClaim: BN;
  maxNumNodes: BN;
  unlockPeriod: number;
  startVestingTs: number;
  endVestingTs: number;
  clawbackStartTs: number;
  claimsClosable: boolean;
}

export interface IClaimData {
  id: string;

  amountUnlocked: BN;
  amountLocked: BN;
  proof: Array<Array<number>>;
}

export interface IClawbackData {
  id: string;
}

export interface IGetClaimsData {
  id: string;

  recipients: string[];
}

export interface IGetDistributors {
  ids: string[];
}

export interface ISetDataAdmin {
  id: string;
  newAdmin: string;
}

export interface ISetClawbackReceiverData {
  id: string;
  newReceiver: string;
}

export interface ICreateDistributorResult extends ITransactionResult {
  metadataId: string;
}
