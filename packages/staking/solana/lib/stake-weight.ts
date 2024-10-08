import BN from "bn.js";

import { SCALE_PRECISION_FACTOR_BN } from "../constants.js";

export const calculateStakeWeight = (minDuration: BN, maxDuration: BN, maxWeight: BN, duration: BN) => {
  const durationSpan = maxDuration.sub(minDuration);
  if (durationSpan.eq(new BN(0))) {
    return SCALE_PRECISION_FACTOR_BN;
  }
  const durationExceedingMin = duration.sub(minDuration);
  const normalizedWeight = durationExceedingMin.mul(SCALE_PRECISION_FACTOR_BN).div(durationSpan);
  const weightDiff = maxWeight.sub(SCALE_PRECISION_FACTOR_BN);

  return BN.max(
    SCALE_PRECISION_FACTOR_BN.add(normalizedWeight.mul(weightDiff).div(SCALE_PRECISION_FACTOR_BN)),
    SCALE_PRECISION_FACTOR_BN,
  );
};
