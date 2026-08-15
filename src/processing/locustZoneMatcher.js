const { isPointInPolygon, getDistanceKm } = require('../utils/geoUtils');

// Match locust swarm reports against administrative boundary polygon
function matchLocustThreat(locustReports = [], woredaGeoJson, bufferKm = 25) {
  if (!locustReports.length || !woredaGeoJson) {
    return { threatLevel: 'NONE', matchedReports: [], locustRiskScore: 0.0 };
  }

  const matched = [];

  for (const report of locustReports) {
    try {
      const pt = [report.lng, report.lat];
      if (isPointInPolygon(pt, woredaGeoJson)) {
        matched.push({ ...report, directHit: true, distanceKm: 0 });
      } else {
        const center = [39.27, 8.54];
        const dist = getDistanceKm(pt, center);
        if (dist <= bufferKm) {
          matched.push({ ...report, directHit: false, distanceKm: dist });
        }
      }
    } catch (_err) {
      // Continue next report
    }
  }

  let threatLevel = 'NONE';
  let locustRiskScore = 0.0;

  if (matched.length > 0) {
    const hasDirect = matched.some((m) => m.directHit);
    if (hasDirect) {
      threatLevel = 'HIGH';
      locustRiskScore = 0.8;
    } else {
      threatLevel = 'LOW';
      locustRiskScore = 0.3;
    }
  }

  return { threatLevel, matchedReports: matched, locustRiskScore };
}

// Pipeline processor interface
function processData(payload = {}) {
  const result = matchLocustThreat(payload.locustReports, payload.woredaGeoJson, payload.bufferKm);

  return {
    woredaId: payload.woredaId || 'UNKNOWN',
    evaluatedAt: new Date().toISOString(),
    ...result,
  };
}

module.exports = {
  matchLocustThreat,
  processData,
};
