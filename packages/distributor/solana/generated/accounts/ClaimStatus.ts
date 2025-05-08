import { PublicKey, Connection } from "@solana/web3.js";
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars

import { PROGRAM_ID } from "../programId.js";

export interface ClaimStatusFields {
  /** Authority that claimed the tokens. */
  claimant: PublicKey;
  /** Locked amount */
  lockedAmount: BN;
  /** Locked amount withdrawn */
  lockedAmountWithdrawn: BN;
  /** Unlocked amount */
  unlockedAmount: BN;
  /** Last claim time */
  lastClaimTs: BN;
  /** Track amount per unlock, can be useful for non-linear vesting */
  lastAmountPerUnlock: BN;
  /** Whether claim is closed */
  closed: boolean;
  /** Distributor account for which ClaimStatus was created, useful to filter by in get_program_accounts */
  distributor: PublicKey;
  /** Number of time amount has been claimed */
  claimsCount: number;
  /** Time when claim was closed */
  closedTs: BN;
  /** Buffer for additional fields */
  buffer2: Array<number>;
}

export interface ClaimStatusJSON {
  /** Authority that claimed the tokens. */
  claimant: string;
  /** Locked amount */
  lockedAmount: string;
  /** Locked amount withdrawn */
  lockedAmountWithdrawn: string;
  /** Unlocked amount */
  unlockedAmount: string;
  /** Last claim time */
  lastClaimTs: string;
  /** Track amount per unlock, can be useful for non-linear vesting */
  lastAmountPerUnlock: string;
  /** Whether claim is closed */
  closed: boolean;
  /** Distributor account for which ClaimStatus was created, useful to filter by in get_program_accounts */
  distributor: string;
  /** Number of time amount has been claimed */
  claimsCount: number;
  /** Time when claim was closed */
  closedTs: string;
  /** Buffer for additional fields */
  buffer2: Array<number>;
}

/** Holds whether or not a claimant has claimed tokens. */
export class ClaimStatus {
  /** Authority that claimed the tokens. */
  readonly claimant: PublicKey;

  /** Locked amount */
  readonly lockedAmount: BN;

  /** Locked amount withdrawn */
  readonly lockedAmountWithdrawn: BN;

  /** Unlocked amount */
  readonly unlockedAmount: BN;

  /** Last claim time */
  readonly lastClaimTs: BN;

  /** Track amount per unlock, can be useful for non-linear vesting */
  readonly lastAmountPerUnlock: BN;

  /** Whether claim is closed */
  readonly closed: boolean;

  /** Distributor account for which ClaimStatus was created, useful to filter by in get_program_accounts */
  readonly distributor: PublicKey;

  /** Number of time amount has been claimed */
  readonly claimsCount: number;

  /** Time when claim was closed */
  readonly closedTs: BN;

  /** Buffer for additional fields */
  readonly buffer2: Array<number>;

  static readonly discriminator = Buffer.from([22, 183, 249, 157, 247, 95, 150, 96]);

  static readonly layout = borsh.struct([
    borsh.publicKey("claimant"),
    borsh.u64("lockedAmount"),
    borsh.u64("lockedAmountWithdrawn"),
    borsh.u64("unlockedAmount"),
    borsh.u64("lastClaimTs"),
    borsh.u64("lastAmountPerUnlock"),
    borsh.bool("closed"),
    borsh.publicKey("distributor"),
    borsh.u16("claimsCount"),
    borsh.u64("closedTs"),
    borsh.array(borsh.u8(), 22, "buffer2"),
  ]);

  constructor(fields: ClaimStatusFields) {
    this.claimant = fields.claimant;
    this.lockedAmount = fields.lockedAmount;
    this.lockedAmountWithdrawn = fields.lockedAmountWithdrawn;
    this.unlockedAmount = fields.unlockedAmount;
    this.lastClaimTs = fields.lastClaimTs;
    this.lastAmountPerUnlock = fields.lastAmountPerUnlock;
    this.closed = fields.closed;
    this.distributor = fields.distributor;
    this.claimsCount = fields.claimsCount;
    this.closedTs = fields.closedTs;
    this.buffer2 = fields.buffer2;
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID,
  ): Promise<ClaimStatus | null> {
    const info = await c.getAccountInfo(address);

    if (info === null) {
      return null;
    }
    if (!info.owner.equals(programId)) {
      throw new Error("account doesn't belong to this program");
    }

    return this.decode(info.data);
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[],
    programId: PublicKey = PROGRAM_ID,
  ): Promise<Array<ClaimStatus | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses);

    return infos.map((info) => {
      if (info === null) {
        return null;
      }
      if (!info.owner.equals(programId)) {
        throw new Error("account doesn't belong to this program");
      }

      return this.decode(info.data);
    });
  }

  static decode(data: Buffer): ClaimStatus {
    if (!data.slice(0, 8).equals(ClaimStatus.discriminator)) {
      throw new Error("invalid account discriminator");
    }

    const dec = ClaimStatus.layout.decode(data.slice(8));

    return new ClaimStatus({
      claimant: dec.claimant,
      lockedAmount: dec.lockedAmount,
      lockedAmountWithdrawn: dec.lockedAmountWithdrawn,
      unlockedAmount: dec.unlockedAmount,
      lastClaimTs: dec.lastClaimTs,
      lastAmountPerUnlock: dec.lastAmountPerUnlock,
      closed: dec.closed,
      distributor: dec.distributor,
      claimsCount: dec.claimsCount,
      closedTs: dec.closedTs,
      buffer2: dec.buffer2,
    });
  }

  toJSON(): ClaimStatusJSON {
    return {
      claimant: this.claimant.toString(),
      lockedAmount: this.lockedAmount.toString(),
      lockedAmountWithdrawn: this.lockedAmountWithdrawn.toString(),
      unlockedAmount: this.unlockedAmount.toString(),
      lastClaimTs: this.lastClaimTs.toString(),
      lastAmountPerUnlock: this.lastAmountPerUnlock.toString(),
      closed: this.closed,
      distributor: this.distributor.toString(),
      claimsCount: this.claimsCount,
      closedTs: this.closedTs.toString(),
      buffer2: this.buffer2,
    };
  }

  static fromJSON(obj: ClaimStatusJSON): ClaimStatus {
    return new ClaimStatus({
      claimant: new PublicKey(obj.claimant),
      lockedAmount: new BN(obj.lockedAmount),
      lockedAmountWithdrawn: new BN(obj.lockedAmountWithdrawn),
      unlockedAmount: new BN(obj.unlockedAmount),
      lastClaimTs: new BN(obj.lastClaimTs),
      lastAmountPerUnlock: new BN(obj.lastAmountPerUnlock),
      closed: obj.closed,
      distributor: new PublicKey(obj.distributor),
      claimsCount: obj.claimsCount,
      closedTs: new BN(obj.closedTs),
      buffer2: obj.buffer2,
    });
  }
}
