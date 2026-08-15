const DEFAULT_WEIGHTS = {
  drought: 0.35,
  flood: 0.25,
  locust: 0.25,
  vegetation: 0.15,
};

// Map composite score (0-1) to 4-tier alert level
function getAlertLevel(score) {
  if (score >= 0.75) return 'RED';
  if (score >= 0.5) return 'ORANGE';
  if (score >= 0.25) return 'YELLOW';
  return 'GREEN';
}

// Calculate weighted multi-hazard composite risk index
function calculateCompositeRisk(hazardScores = {}, customWeights = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

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
  processData,
  DEFAULT_WEIGHTS,
};
