// ── Ethiopian Agricultural Season Definitions ──
// Kiremt (Main Rainy): June–September (months 6–9)
// Belg (Short Rainy):  March–May (months 3–5)
// Dry / Bega:          October–February (months 10–2)

const SEASON_WEIGHTS = {
  KIREMT: { drought: 0.20, flood: 0.40, locust: 0.25, vegetation: 0.15 },   // June–Sep: flood peaks
  BELG:   { drought: 0.30, flood: 0.25, locust: 0.30, vegetation: 0.15 },   // Mar–May: balanced, locust risk
  DRY:    { drought: 0.45, flood: 0.10, locust: 0.25, vegetation: 0.20 },   // Oct–Feb: drought dominant
};

const DEFAULT_WEIGHTS = SEASON_WEIGHTS.BELG; // fallback (exported for backward compat)

/**
 * Returns the active hazard weights for the current Ethiopian season.
 * Month is 1-indexed (1 = January).
 */
function getSeasonalWeights(month = new Date().getMonth() + 1) {
  if (month >= 6 && month <= 9) return { season: 'KIREMT', ...SEASON_WEIGHTS.KIREMT };
  if (month >= 3 && month <= 5) return { season: 'BELG',   ...SEASON_WEIGHTS.BELG };
  return { season: 'DRY', ...SEASON_WEIGHTS.DRY };
}

// Map composite score (0-1) to 4-tier alert level
function getAlertLevel(score) {
  if (score >= 0.75) return 'RED';
  if (score >= 0.5) return 'ORANGE';
  if (score >= 0.25) return 'YELLOW';
  return 'GREEN';
}

// Calculate weighted integrated risk composite risk index
function calculateCompositeRisk(hazardScores = {}, customWeights = {}) {
  const seasonal = getSeasonalWeights();
  // customWeights fully override seasonal weights when provided
  const weights = Object.keys(customWeights).length > 0
    ? { ...seasonal, ...customWeights }
    : seasonal;

  const sDrought = Math.max(0, Math.min(1, hazardScores.drought || 0));
  const sFlood = Math.max(0, Math.min(1, hazardScores.flood || 0));
  const sLocust = Math.max(0, Math.min(1, hazardScores.locust || 0));
  const sVeg = Math.max(0, Math.min(1, hazardScores.vegetation || 0));

  const weightedSum =
    sDrought * weights.drought +
    sFlood * weights.flood +
    sLocust * weights.locust +
    sVeg * weights.vegetation;

  const totalWeight = weights.drought + weights.flood + weights.locust + weights.vegetation;
  const compositeScore = Math.round((weightedSum / totalWeight) * 100) / 100;

  const drivers = [
    { name: 'DROUGHT', score: sDrought },
    { name: 'FLOOD', score: sFlood },
    { name: 'LOCUST', score: sLocust },
    { name: 'VEGETATION_STRESS', score: sVeg },
  ];
  drivers.sort((a, b) => b.score - a.score);
  const primaryThreat = drivers[0].score > 0.2 ? drivers[0].name : 'NONE';

  return {
    compositeScore,
    alertLevel: getAlertLevel(compositeScore),
    primaryThreat,
    season: weights.season || 'CUSTOM',
    breakdown: {
      drought: { score: sDrought, weight: weights.drought },
      flood: { score: sFlood, weight: weights.flood },
      locust: { score: sLocust, weight: weights.locust },
      vegetation: { score: sVeg, weight: weights.vegetation },
    },
  };
}

// Pipeline processor interface
function processData(payload = {}) {
  const result = calculateCompositeRisk(payload.hazardScores, payload.weights);

  return {
    woredaId: payload.woredaId || 'UNKNOWN',
    assessedAt: new Date().toISOString(),
    ...result,
  };
}

module.exports = {
  calculateCompositeRisk,
  getAlertLevel,
  getSeasonalWeights,
  processData,
  DEFAULT_WEIGHTS,
  SEASON_WEIGHTS,
};

