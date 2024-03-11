import { PublicKey, Connection } from "@solana/web3.js";
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars

import { PROGRAM_ID } from "../programId";

export interface MerkleDistributorFields {
  /** Bump seed. */
  bump: number;
  /** Version of the airdrop */
  version: BN;
  /** The 256-bit merkle root. */
  root: Array<number>;
  /** [Mint] of the token to be distributed. */
  mint: PublicKey;
  /** Token Address of the vault */
  tokenVault: PublicKey;
  /** Maximum number of tokens that can ever be claimed from this [MerkleDistributor]. */
  maxTotalClaim: BN;
  /** Maximum number of nodes in [MerkleDistributor]. */
  maxNumNodes: BN;
  /** Time step (period) in seconds per which the unlock occurs */
  unlockPeriod: BN;
  /** Total amount of tokens that have been claimed. */
  totalAmountClaimed: BN;
  /** Number of nodes that have been claimed. */
  numNodesClaimed: BN;
  /** Lockup time start (Unix Timestamp) */
  startTs: BN;
  /** Lockup time end (Unix Timestamp) */
  endTs: BN;
  /** Clawback start (Unix Timestamp) */
  clawbackStartTs: BN;
  /** Clawback receiver */
  clawbackReceiver: PublicKey;
  /** Admin wallet */
  admin: PublicKey;
  /** Whether or not the distributor has been clawed back */
  clawedBack: boolean;
  /** Whether claims are closable by the admin or not */
  claimsClosable: boolean;
  /** Buffer for additional fields */
  buffer1: Array<number>;
  /** Buffer for additional fields */
  buffer2: Array<number>;
  /** Buffer for additional fields */
  buffer3: Array<number>;
}

export interface MerkleDistributorJSON {
  /** Bump seed. */
  bump: number;
  /** Version of the airdrop */
  version: string;
  /** The 256-bit merkle root. */
  root: Array<number>;
  /** [Mint] of the token to be distributed. */
  mint: string;
  /** Token Address of the vault */
  tokenVault: string;
  /** Maximum number of tokens that can ever be claimed from this [MerkleDistributor]. */
  maxTotalClaim: string;
  /** Maximum number of nodes in [MerkleDistributor]. */
  maxNumNodes: string;
  /** Time step (period) in seconds per which the unlock occurs */
  unlockPeriod: string;
  /** Total amount of tokens that have been claimed. */
  totalAmountClaimed: string;
  /** Number of nodes that have been claimed. */
  numNodesClaimed: string;
  /** Lockup time start (Unix Timestamp) */
  startTs: string;
  /** Lockup time end (Unix Timestamp) */
  endTs: string;
  /** Clawback start (Unix Timestamp) */
  clawbackStartTs: string;
  /** Clawback receiver */
  clawbackReceiver: string;
  /** Admin wallet */
  admin: string;
  /** Whether or not the distributor has been clawed back */
  clawedBack: boolean;
  /** Whether claims are closable by the admin or not */
  claimsClosable: boolean;
  /** Buffer for additional fields */
  buffer1: Array<number>;
  /** Buffer for additional fields */
  buffer2: Array<number>;
  /** Buffer for additional fields */
  buffer3: Array<number>;
}

/** State for the account which distributes tokens. */
export class MerkleDistributor {
  /** Bump seed. */
  readonly bump: number;

  /** Version of the airdrop */
  readonly version: BN;

  /** The 256-bit merkle root. */
  readonly root: Array<number>;

  /** [Mint] of the token to be distributed. */
  readonly mint: PublicKey;

  /** Token Address of the vault */
  readonly tokenVault: PublicKey;

  /** Maximum number of tokens that can ever be claimed from this [MerkleDistributor]. */
  readonly maxTotalClaim: BN;

  /** Maximum number of nodes in [MerkleDistributor]. */
  readonly maxNumNodes: BN;

  /** Time step (period) in seconds per which the unlock occurs */
  readonly unlockPeriod: BN;

  /** Total amount of tokens that have been claimed. */
  readonly totalAmountClaimed: BN;

  /** Number of nodes that have been claimed. */
  readonly numNodesClaimed: BN;

  /** Lockup time start (Unix Timestamp) */
  readonly startTs: BN;

  /** Lockup time end (Unix Timestamp) */
  readonly endTs: BN;

  /** Clawback start (Unix Timestamp) */
  readonly clawbackStartTs: BN;

  /** Clawback receiver */
  readonly clawbackReceiver: PublicKey;

  /** Admin wallet */
  readonly admin: PublicKey;

  /** Whether or not the distributor has been clawed back */
  readonly clawedBack: boolean;

  /** Whether claims are closable by the admin or not */
  readonly claimsClosable: boolean;

  /** Buffer for additional fields */
  readonly buffer1: Array<number>;

  /** Buffer for additional fields */
  readonly buffer2: Array<number>;

  /** Buffer for additional fields */
  readonly buffer3: Array<number>;

  static readonly discriminator = Buffer.from([77, 119, 139, 70, 84, 247, 12, 26]);

  static readonly layout = borsh.struct([
    borsh.u8("bump"),
    borsh.u64("version"),
    borsh.array(borsh.u8(), 32, "root"),
    borsh.publicKey("mint"),
    borsh.publicKey("tokenVault"),
    borsh.u64("maxTotalClaim"),
    borsh.u64("maxNumNodes"),
    borsh.u64("unlockPeriod"),
    borsh.u64("totalAmountClaimed"),
    borsh.u64("numNodesClaimed"),
    borsh.u64("startTs"),
    borsh.u64("endTs"),
    borsh.u64("clawbackStartTs"),
    borsh.publicKey("clawbackReceiver"),
    borsh.publicKey("admin"),
    borsh.bool("clawedBack"),
    borsh.bool("claimsClosable"),
    borsh.array(borsh.u8(), 32, "buffer1"),
    borsh.array(borsh.u8(), 32, "buffer2"),
    borsh.array(borsh.u8(), 32, "buffer3"),
  ]);

  constructor(fields: MerkleDistributorFields) {
    this.bump = fields.bump;
    this.version = fields.version;
    this.root = fields.root;
    this.mint = fields.mint;
    this.tokenVault = fields.tokenVault;
    this.maxTotalClaim = fields.maxTotalClaim;
    this.maxNumNodes = fields.maxNumNodes;
    this.unlockPeriod = fields.unlockPeriod;
    this.totalAmountClaimed = fields.totalAmountClaimed;
    this.numNodesClaimed = fields.numNodesClaimed;
    this.startTs = fields.startTs;
    this.endTs = fields.endTs;
    this.clawbackStartTs = fields.clawbackStartTs;
    this.clawbackReceiver = fields.clawbackReceiver;
    this.admin = fields.admin;
    this.clawedBack = fields.clawedBack;
    this.claimsClosable = fields.claimsClosable;
    this.buffer1 = fields.buffer1;
    this.buffer2 = fields.buffer2;
    this.buffer3 = fields.buffer3;
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID,
  ): Promise<MerkleDistributor | null> {
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
  ): Promise<Array<MerkleDistributor | null>> {
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

  static decode(data: Buffer): MerkleDistributor {
    if (!data.slice(0, 8).equals(MerkleDistributor.discriminator)) {
      throw new Error("invalid account discriminator");
    }

    const dec = MerkleDistributor.layout.decode(data.slice(8));

    return new MerkleDistributor({
      bump: dec.bump,
      version: dec.version,
      root: dec.root,
      mint: dec.mint,
      tokenVault: dec.tokenVault,
      maxTotalClaim: dec.maxTotalClaim,
      maxNumNodes: dec.maxNumNodes,
      unlockPeriod: dec.unlockPeriod,
      totalAmountClaimed: dec.totalAmountClaimed,
      numNodesClaimed: dec.numNodesClaimed,
      startTs: dec.startTs,
      endTs: dec.endTs,
      clawbackStartTs: dec.clawbackStartTs,
      clawbackReceiver: dec.clawbackReceiver,
      admin: dec.admin,
      clawedBack: dec.clawedBack,
      claimsClosable: dec.claimsClosable,
      buffer1: dec.buffer1,
      buffer2: dec.buffer2,
      buffer3: dec.buffer3,
    });
  }

  toJSON(): MerkleDistributorJSON {
    return {
      bump: this.bump,
      version: this.version.toString(),
      root: this.root,
      mint: this.mint.toString(),
      tokenVault: this.tokenVault.toString(),
      maxTotalClaim: this.maxTotalClaim.toString(),
      maxNumNodes: this.maxNumNodes.toString(),
      unlockPeriod: this.unlockPeriod.toString(),
      totalAmountClaimed: this.totalAmountClaimed.toString(),
      numNodesClaimed: this.numNodesClaimed.toString(),
      startTs: this.startTs.toString(),
      endTs: this.endTs.toString(),
      clawbackStartTs: this.clawbackStartTs.toString(),
      clawbackReceiver: this.clawbackReceiver.toString(),
      admin: this.admin.toString(),
      clawedBack: this.clawedBack,
      claimsClosable: this.claimsClosable,
      buffer1: this.buffer1,
      buffer2: this.buffer2,
      buffer3: this.buffer3,
    };
  }

  static fromJSON(obj: MerkleDistributorJSON): MerkleDistributor {
    return new MerkleDistributor({
      bump: obj.bump,
      version: new BN(obj.version),
      root: obj.root,
      mint: new PublicKey(obj.mint),
      tokenVault: new PublicKey(obj.tokenVault),
      maxTotalClaim: new BN(obj.maxTotalClaim),
      maxNumNodes: new BN(obj.maxNumNodes),
      unlockPeriod: new BN(obj.unlockPeriod),
      totalAmountClaimed: new BN(obj.totalAmountClaimed),
      numNodesClaimed: new BN(obj.numNodesClaimed),
      startTs: new BN(obj.startTs),
      endTs: new BN(obj.endTs),
      clawbackStartTs: new BN(obj.clawbackStartTs),
      clawbackReceiver: new PublicKey(obj.clawbackReceiver),
      admin: new PublicKey(obj.admin),
      clawedBack: obj.clawedBack,
      claimsClosable: obj.claimsClosable,
      buffer1: obj.buffer1,
      buffer2: obj.buffer2,
      buffer3: obj.buffer3,
    });
  }
}
