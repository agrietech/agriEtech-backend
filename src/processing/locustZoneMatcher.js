const { isPointInPolygon, getDistanceKm, getCentroid, getBBox } = require('../utils/geoUtils');

// Match locust swarm reports against administrative boundary polygon with O(1) BBox pre-filtering
function matchLocustThreat(locustReports = [], woredaGeoJson, bufferKm = 25) {
  if (!locustReports.length || !woredaGeoJson) {
    return { threatLevel: 'NONE', matchedReports: [], locustRiskScore: 0.0 };
  }

  const [minLng, minLat, maxLng, maxLat] = getBBox(woredaGeoJson);
  const bufferDegrees = bufferKm / 111.0;
  const expandedBBox = [
    minLng - bufferDegrees,
    minLat - bufferDegrees,
    maxLng + bufferDegrees,
    maxLat + bufferDegrees,
  ];

  const center = getCentroid(woredaGeoJson);
  const matched = [];

  for (const report of locustReports) {
    try {
      const lng = Number(report.lng);
      const lat = Number(report.lat);
      if (Number.isNaN(lng) || Number.isNaN(lat)) continue;

      // O(1) Fast Rejection: check if outside expanded bounding box
      if (
        lng < expandedBBox[0] ||
        lat < expandedBBox[1] ||
        lng > expandedBBox[2] ||
        lat > expandedBBox[3]
      ) {
        continue;
      }

      const pt = [lng, lat];
      if (isPointInPolygon(pt, woredaGeoJson)) {
        matched.push({ ...report, directHit: true, distanceKm: 0 });
      } else {
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
