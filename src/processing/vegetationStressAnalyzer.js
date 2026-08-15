// Calculate Vegetation Condition Index (VCI) from satellite NDVI
function calculateVci(currentNdvi, ndviMin = 0.1, ndviMax = 0.8) {
  if (ndviMax <= ndviMin) {
    return { vci: 50.0, condition: 'NORMAL', stressScore: 0.3 };
  }

  const clamped = Math.max(ndviMin, Math.min(ndviMax, currentNdvi));
  const vci = Math.round(((clamped - ndviMin) / (ndviMax - ndviMin)) * 100 * 10) / 10;

  let condition = 'NORMAL';
  let stressScore = 0.25;

  if (vci < 10) {
    condition = 'EXTREME_STRESS';
    stressScore = 1.0;
  } else if (vci < 20) {
    condition = 'SEVERE_STRESS';
    stressScore = 0.8;
  } else if (vci < 35) {
    condition = 'MODERATE_STRESS';
    stressScore = 0.5;
  } else if (vci > 50) {
    condition = 'EXCELLENT';
    stressScore = 0.05;
  }

  return { vci, condition, stressScore };
}

// Pipeline processor interface
function processData(payload = {}) {
  const currentNdvi = payload.ndvi || 0.45;
  const result = calculateVci(currentNdvi, payload.ndviMin, payload.ndviMax);

  return {
    woredaId: payload.woredaId || 'UNKNOWN',
    analyzedAt: new Date().toISOString(),
    ndvi: currentNdvi,
    ...result,
  };
}

module.exports = {
  calculateVci,
  processData,
};
