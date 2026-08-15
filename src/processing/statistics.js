// Mean of numeric series
function mean(values = []) {
  if (!values.length) return 0;
  return values.reduce((acc, val) => acc + val, 0) / values.length;
}

// Sample variance
function variance(values = []) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / (values.length - 1);
}

// Standard deviation
function stdDev(values = []) {
  return Math.sqrt(variance(values));
}

// Z-score calculation
function zScore(value, avg, std) {
  if (!std) return 0;
  return (value - avg) / std;
}

// 2-parameter Gamma distribution fit via MLE (Thom's approximation)
function fitGammaDistribution(nonZeroValues = []) {
  if (!nonZeroValues.length) return { alpha: 1, beta: 1 };
  const n = nonZeroValues.length;
  const xBar = mean(nonZeroValues);
  if (xBar <= 0) return { alpha: 1, beta: 1 };

  const sumLnX = nonZeroValues.reduce((acc, x) => acc + Math.log(Math.max(x, 0.0001)), 0);
  const A = Math.log(xBar) - sumLnX / n;
  if (A <= 0) return { alpha: 1, beta: xBar };

  const alpha = (1 + Math.sqrt(1 + (4 * A) / 3)) / (4 * A);
  const beta = xBar / alpha;
  return { alpha, beta };
}

module.exports = {
  mean,
  variance,
  stdDev,
  zScore,
  fitGammaDistribution,
};
