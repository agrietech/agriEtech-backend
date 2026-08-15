// Evaluate hydrologic river discharge against return period thresholds
function evaluateDischargeRisk(dischargeM3s, thresholds = { q2: 500, q5: 850, q20: 1200 }) {
  const { q2, q5, q20 } = thresholds;

  if (dischargeM3s >= q20) {
    return { level: 'CRITICAL', score: 1.0, exceedance: 'EXCEEDS_20_YEAR_FLOOD' };
  }
  if (dischargeM3s >= q5) {
    const ratio = (dischargeM3s - q5) / (q20 - q5);
    return { level: 'HIGH', score: 0.65 + 0.2 * ratio, exceedance: 'EXCEEDS_5_YEAR_FLOOD' };
  }
  if (dischargeM3s >= q2) {
    const ratio = (dischargeM3s - q2) / (q5 - q2);
    return { level: 'MODERATE', score: 0.35 + 0.3 * ratio, exceedance: 'EXCEEDS_2_YEAR_FLOOD' };
  }

  const ratio = Math.max(0, dischargeM3s / q2);
  return {
    level: 'LOW',
    score: Math.round(0.3 * ratio * 100) / 100,
    exceedance: 'BELOW_WARNING_THRESHOLDS',
  };
}

// Evaluate flash flood threat from intense short-term precipitation
function evaluateFlashFloodRisk(rain24hMm) {
  if (rain24hMm >= 100) return { level: 'CRITICAL', score: 0.95 };
  if (rain24hMm >= 70) return { level: 'HIGH', score: 0.75 };
  if (rain24hMm >= 40) return { level: 'MODERATE', score: 0.45 };
  return { level: 'LOW', score: 0.1 };
}

// Pipeline processor interface
function processData(payload = {}) {
  const discharge = payload.dischargeM3s || 0;
  const rain24h = payload.rain24hMm || 0;
  const hydrologic = evaluateDischargeRisk(discharge, payload.thresholds);
  const flash = evaluateFlashFloodRisk(rain24h);

  return {
    woredaId: payload.woredaId || 'UNKNOWN',
    evaluatedAt: new Date().toISOString(),
    dischargeM3s: discharge,
    rain24hMm: rain24h,
    hydrologicRisk: hydrologic,
    flashFloodRisk: flash,
    compositeFloodScore: Math.max(hydrologic.score, flash.score),
  };
}

module.exports = {
  evaluateDischargeRisk,
  evaluateFlashFloodRisk,
  processData,
};
