// Geodesic distance in km via Haversine formula
function getDistanceKm(point1, point2) {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Point-in-polygon test via ray-casting
function isPointInPolygon(point, polygonOrFeature) {
  try {
    const [x, y] = point;
    let coords = polygonOrFeature;

    if (polygonOrFeature?.geometry?.coordinates) {
      coords = polygonOrFeature.geometry.coordinates[0];
    } else if (polygonOrFeature?.coordinates) {
      coords = polygonOrFeature.coordinates[0];
    }

    if (!Array.isArray(coords)) return false;

    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const [xi, yi] = coords[i];
      const [xj, yj] = coords[j];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  } catch (_error) {
    return false;
  }
}

// Bounding box [minLng, minLat, maxLng, maxLat]
function getBBox(geojson) {
  let coords = geojson?.geometry?.coordinates?.[0] || geojson?.coordinates?.[0] || geojson;

  if (!Array.isArray(coords) || coords.length === 0) {
    return [32.5, 3.0, 48.5, 15.5];
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLng, minLat, maxLng, maxLat];
}

// Area in square meters and hectares
function calculateArea(polygonOrFeature) {
  const coords = polygonOrFeature?.geometry?.coordinates?.[0] || polygonOrFeature;

  if (!Array.isArray(coords) || coords.length < 3) {
    return { sqMeters: 0, hectares: 0 };
  }

  let area = 0;
  const factor = 111319.5;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    area += p1[0] * factor * (p2[1] * factor) - p2[0] * factor * (p1[1] * factor);
  }
  const sqMeters = Math.abs(area) / 2;
  return {
    sqMeters: Math.round(sqMeters * 100) / 100,
    hectares: Math.round((sqMeters / 10000) * 100) / 100,
  };
}

// Verify coordinates within Ethiopian boundary
function isWithinEthiopia(lat, lng) {
  return lat >= 3.0 && lat <= 15.5 && lng >= 32.5 && lng <= 48.5;
}

module.exports = {
  isPointInPolygon,
  getBBox,
  getDistanceKm,
  calculateArea,
  isWithinEthiopia,
};
