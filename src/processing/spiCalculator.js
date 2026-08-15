const { fitGammaDistribution, mean, stdDev, zScore } = require('./statistics');

// Classify numerical SPI into WMO drought categories
function classifySpiCategory(spi) {
  if (spi <= -2.0) return 'EXTREME_DROUGHT';
  if (spi <= -1.5) return 'SEVERE_DROUGHT';
  if (spi <= -1.0) return 'MODERATE_DROUGHT';
  if (spi < 1.0) return 'NEAR_NORMAL';
  if (spi < 1.5) return 'MODERATELY_WET';
  if (spi < 2.0) return 'VERY_WET';
  return 'EXTREMELY_WET';
}

// Calculate SPI value from historical precipitation series
function calculateSpi(currentRainfall, historicalRainfall = []) {
  if (!historicalRainfall.length) {
    return { spi: 0.0, category: 'NEAR_NORMAL', droughtRiskScore: 0.2 };
  }

  const avg = mean(historicalRainfall);
  const std = stdDev(historicalRainfall);

  let spiVal = 0.0;
  if (std > 0) {
    spiVal = Math.round(zScore(currentRainfall, avg, std) * 100) / 100;
  } else if (currentRainfall < avg) {
    spiVal = -1.5;
  } else if (currentRainfall > avg) {
    spiVal = 1.5;
  }

  spiVal = Math.max(-3.5, Math.min(3.5, spiVal));
  const category = classifySpiCategory(spiVal);

  let droughtRiskScore = 0.05;
  if (spiVal <= -2.0) {
    droughtRiskScore = 1.0;
  } else if (spiVal < 0) {
    droughtRiskScore = Math.round(Math.abs(spiVal / 2.0) * 100) / 100;
  }

  return { spi: spiVal, category, droughtRiskScore };
}

// Pipeline processor interface
function processData(payload = {}) {
  const current = payload.currentRainfallMm || 0;
  const history = payload.historicalSeries || [current];
  const { alpha, beta } = fitGammaDistribution(history.filter((x) => x > 0));
  const assessment = calculateSpi(current, history);

  return {
    woredaId: payload.woredaId || 'UNKNOWN',
    calculatedAt: new Date().toISOString(),
    currentRainfallMm: current,
    gammaParams: { alpha: Math.round(alpha * 1000) / 1000, beta: Math.round(beta * 1000) / 1000 },
    ...assessment,
  };
}

module.exports = {
  calculateSpi,
  classifySpiCategory,
  processData,
};
