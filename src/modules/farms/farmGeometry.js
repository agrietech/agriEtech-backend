const { polygon: createPolygon, multiPolygon: createMultiPolygon } = require('@turf/helpers');
const kinks = require('@turf/kinks').default || require('@turf/kinks');
const booleanWithin = require('@turf/boolean-within').default || require('@turf/boolean-within');
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default || require('@turf/boolean-point-in-polygon');
const centroid = require('@turf/centroid').default || require('@turf/centroid');
const logger = require('../../utils/logger');

// Ethiopian geographic bounding box (approximate)
const ETHIOPIA_BOUNDS = { minLat: 3.0, maxLat: 15.5, minLng: 32.5, maxLng: 48.5 };

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Validate that a value is a well-formed GeoJSON Polygon or MultiPolygon geometry or Feature.
 * Returns a turf Feature on success; throws an HTTP-ready error otherwise.
 */
function asPolygon(geojson, label) {
  if (!geojson || typeof geojson !== 'object') {
    throw createHttpError(`${label} must be a valid GeoJSON object`);
  }

  // Unwrap Feature to bare geometry
  const geometry = geojson.type === 'Feature' ? geojson.geometry : geojson;
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type) || !Array.isArray(geometry.coordinates)) {
    throw createHttpError(`${label} must be a GeoJSON Polygon or MultiPolygon`);
  }

  if (geometry.type === 'MultiPolygon') {
    try {
      return createMultiPolygon(geometry.coordinates);
    } catch (err) {
      throw createHttpError(`${label} has invalid MultiPolygon coordinates: ${err.message}`);
    }
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

    if (ring.length < 4) {
      throw createHttpError(
        `${label} has invalid polygon coordinates: ${ringLabel} must have at least 4 positions`
      );
    }

    for (let i = 0; i < ring.length; i++) {
      const pos = ring[i];
      if (!Array.isArray(pos) || pos.length < 2) {
        throw createHttpError(`${label} ${ringLabel} position[${i}] must be [lng, lat]`);
      }

      let [lng, lat] = pos;

      if (typeof lng !== 'number' || typeof lat !== 'number' || !isFinite(lng) || !isFinite(lat)) {
        throw createHttpError(
          `${label} ${ringLabel} position[${i}] contains non-numeric or non-finite coordinates`
        );
      }

      // Auto-correct inverted lat/lng coordinates (e.g. [lat, lng] -> [lng, lat])
      if (
        lng >= ETHIOPIA_BOUNDS.minLat &&
        lng <= ETHIOPIA_BOUNDS.maxLat &&
        lat >= ETHIOPIA_BOUNDS.minLng &&
        lat <= ETHIOPIA_BOUNDS.maxLng
      ) {
        const temp = lng;
        lng = lat;
        lat = temp;
        ring[i] = [lng, lat];
      }

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

    // Ring closure check & auto-fix
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }
  }

  let polygonFeature;
  try {
    polygonFeature = createPolygon(geometry.coordinates);
  } catch (error) {
    throw createHttpError(`${label} has invalid polygon coordinates: ${error.message}`);
  }

  const kinkFeatures = kinks(polygonFeature);
  if (kinkFeatures.features.length > 0) {
    throw createHttpError(`${label} must not self-intersect`);
  }

  return polygonFeature;
}

/**
 * Validate the incoming farm polygon GeoJSON.
 */
function validateFarmPolygon(geojson) {
  return asPolygon(geojson, 'Farm boundary');
}

/**
 * Assert that the farm polygon is contained within the woreda boundary.
 * Supports Polygon and MultiPolygon Woredas, with centroid fallback for GPS points.
 */
function assertContainedByWoreda(farmPolygon, woredaGeojson) {
  const woredaFeature = asPolygon(woredaGeojson, 'Woreda boundary');
  const isWithin = booleanWithin(farmPolygon, woredaFeature);
  if (isWithin) return true;

  const farmCenter = centroid(farmPolygon);
  const centerWithin = booleanPointInPolygon(farmCenter, woredaFeature);
  if (centerWithin) {
    return true;
  }

  throw createHttpError('Farm boundary must be entirely within the selected woreda boundary');
}

module.exports = { assertContainedByWoreda, createHttpError, validateFarmPolygon };

