import type { MemcmpFilter, PublicKey } from "@solana/web3.js";

export const getFilters = <T extends Record<string, number | PublicKey>>(
  criteria: T,
  byteOffsets: Record<keyof T, number>,
): MemcmpFilter[] => {
  return Object.entries(criteria).reduce((acc, [key, value]) => {
    const criteriaKey = key as keyof typeof criteria;
    const effectiveByteOffset = byteOffsets[criteriaKey];
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
};
