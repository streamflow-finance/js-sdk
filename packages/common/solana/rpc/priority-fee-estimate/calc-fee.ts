export const resolveMedian = (values: number[]) => {
  if (values.length < 2) {
    return 0;
  }

  const sortedRates = [...values].sort((a, b) => a - b);
  const medianIndex = Math.floor(sortedRates.length / 2);
  const medianArrValue = sortedRates[medianIndex];
  const medianPrevValue = sortedRates[medianIndex - 1];

  if (medianPrevValue === undefined || medianArrValue === undefined) {
    return 0;
  }

  const medianValue = sortedRates.length % 2 === 0 ? (medianPrevValue + medianArrValue) / 2 : medianArrValue;

  return medianValue;
};
