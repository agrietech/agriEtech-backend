const turf = require('@turf/turf');

// Ethiopian geographic bounding box (approximate)
const ETHIOPIA_BOUNDS = { minLat: 3.0, maxLat: 15.5, minLng: 32.5, maxLng: 48.5 };

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Validate that a value is a well-formed GeoJSON Polygon geometry or Feature.
 * Returns a turf Polygon Feature on success; throws an HTTP-ready error otherwise.
 */
function asPolygon(geojson, label) {
  if (!geojson || typeof geojson !== 'object') {
    throw createHttpError(`${label} must be a GeoJSON Polygon`);
  }

  // Unwrap Feature to bare geometry
  const geometry = geojson.type === 'Feature' ? geojson.geometry : geojson;
  if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) {
    throw createHttpError(`${label} must be a GeoJSON Polygon`);
  }

  const rings = geometry.coordinates;
  if (rings.length === 0) {
    throw createHttpError(`${label} has no coordinate rings`);
  }

  // Validate each ring (outer + any holes)
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    const ringLabel = r === 0 ? 'outer ring' : `hole ring ${r}`;

    if (!Array.isArray(ring)) {
      throw createHttpError(`${label} ${ringLabel} must be an array of positions`);
    }

    // GeoJSON spec: a linear ring must have >= 4 positions (3 distinct + closure)
    if (ring.length < 4) {
      throw createHttpError(
        `${label} ${ringLabel} must have at least 4 positions (3 vertices + closing point)`
      );
    }

    // Validate every coordinate position
    for (let i = 0; i < ring.length; i++) {
      const pos = ring[i];
      if (!Array.isArray(pos) || pos.length < 2) {
        throw createHttpError(`${label} ${ringLabel} position[${i}] must be [lng, lat]`);
      }

      const [lng, lat] = pos;

      if (typeof lng !== 'number' || typeof lat !== 'number' || !isFinite(lng) || !isFinite(lat)) {
        throw createHttpError(
          `${label} ${ringLabel} position[${i}] contains non-numeric or non-finite coordinates`
        );
      }

      // Sanity: coordinates must be within plausible Ethiopian bounds
      if (
        lat < ETHIOPIA_BOUNDS.minLat ||
        lat > ETHIOPIA_BOUNDS.maxLat ||
        lng < ETHIOPIA_BOUNDS.minLng ||
        lng > ETHIOPIA_BOUNDS.maxLng
      ) {
        throw createHttpError(
          `${label} ${ringLabel} position[${i}] [${lng}, ${lat}] falls outside Ethiopia`
        );
      }
    }

    // Ring must be closed (first position === last position)
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      throw createHttpError(`${label} ${ringLabel} must be closed (first and last positions must match)`);
    }
  }

  // Build a turf polygon – will throw on structurally invalid coordinates
  let polygon;
  try {
    polygon = turf.polygon(geometry.coordinates);
  } catch (error) {
    throw createHttpError(`${label} has invalid polygon coordinates: ${error.message}`);
  }

  // Reject self-intersecting rings
  const kinks = turf.kinks(polygon);
  if (kinks.features.length > 0) {
    throw createHttpError(`${label} must not self-intersect`);
  }

  return polygon;
}

/**
 * Validate the incoming farm polygon GeoJSON.
 * Accepts a GeoJSON Polygon geometry or Feature; returns a turf Polygon Feature.
 */
function validateFarmPolygon(geojson) {
  return asPolygon(geojson, 'Farm boundary');
}

/**
 * Assert that the entire farm polygon is contained within the woreda boundary.
 * Throws an HTTP 400 error if the farm extends beyond the woreda.
 */
function assertContainedByWoreda(farmPolygon, woredaGeojson) {
  const woredaPolygon = asPolygon(woredaGeojson, 'Woreda boundary');
  if (!turf.booleanWithin(farmPolygon, woredaPolygon)) {
    throw createHttpError('Farm boundary must be entirely within the selected woreda');
  }
}

module.exports = { assertContainedByWoreda, createHttpError, validateFarmPolygon };
