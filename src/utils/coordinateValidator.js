/**
 * Coordinate Validation Utility
 * Ensures all geographic data is within Ethiopia's boundaries
 */

// Ethiopian geographic boundaries
const ETHIOPIA_BOUNDS = {
  minLat: 3.0, // Southern border (near Kenya)
  maxLat: 15.0, // Northern border (near Eritrea)
  minLng: 33.0, // Western border (near Sudan)
  maxLng: 48.0, // Eastern border (near Somalia)
};

// Major Ethiopian cities for reference (validation helpers)
const MAJOR_CITIES = {
  ADDIS_ABABA: { lat: 9.032, lng: 38.7469, name: 'Addis Ababa' },
  DIRE_DAWA: { lat: 9.601, lng: 41.8661, name: 'Dire Dawa' },
  MEKELE: { lat: 13.4967, lng: 39.4753, name: 'Mekele' },
  GONDAR: { lat: 12.6, lng: 37.4667, name: 'Gondar' },
  BAHIR_DAR: { lat: 11.5933, lng: 37.3906, name: 'Bahir Dar' },
  AWASA: { lat: 7.05, lng: 38.4667, name: 'Awasa' },
  JIMMA: { lat: 7.6703, lng: 36.8344, name: 'Jimma' },
  JIJIGA: { lat: 9.35, lng: 42.8, name: 'Jijiga' },
  HARAR: { lat: 9.3142, lng: 42.1183, name: 'Harar' },
  ADAMA: { lat: 8.54, lng: 39.2675, name: 'Adama (Nazret)' },
};

/**
 * Validate if coordinates are within Ethiopia
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @throws {Error} If coordinates are invalid or outside Ethiopia
 * @returns {boolean} True if valid
 */
const validateEthiopianCoordinates = (lat, lng) => {
  // Type validation
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Coordinates must be numbers');
  }

  // Check for NaN or Infinity
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Coordinates must be finite numbers');
  }

  // Latitude bounds check
  if (lat < ETHIOPIA_BOUNDS.minLat || lat > ETHIOPIA_BOUNDS.maxLat) {
    throw new Error(
      `Latitude ${lat}° is outside Ethiopia. Valid range: ${ETHIOPIA_BOUNDS.minLat}° to ${ETHIOPIA_BOUNDS.maxLat}°N`
    );
  }

  // Longitude bounds check
  if (lng < ETHIOPIA_BOUNDS.minLng || lng > ETHIOPIA_BOUNDS.maxLng) {
    throw new Error(
      `Longitude ${lng}° is outside Ethiopia. Valid range: ${ETHIOPIA_BOUNDS.minLng}° to ${ETHIOPIA_BOUNDS.maxLng}°E`
    );
  }

  return true;
};

/**
 * Validate farm size is reasonable for Ethiopian context
 * @param {number} hectares - Farm size in hectares
 * @throws {Error} If farm size is invalid
 * @returns {boolean} True if valid
 */
const validateFarmSize = (hectares) => {
  if (typeof hectares !== 'number' || !Number.isFinite(hectares)) {
    throw new Error('Farm size must be a valid number');
  }

  if (hectares <= 0) {
    throw new Error('Farm size must be greater than zero');
  }

  // Minimum: 0.01 hectares (100 m²) - Small garden plot
  if (hectares < 0.01) {
    throw new Error('Farm size must be at least 0.01 hectares (100 m²)');
  }

  // Maximum: 1000 hectares - Large commercial farms should contact support
  if (hectares > 1000) {
    throw new Error(
      'Farm size cannot exceed 1000 hectares in self-service registration. ' +
        'Please contact support for large commercial farms.'
    );
  }

  return true;
};

/**
 * Check if coordinates are suspiciously close to [0, 0] (default GPS failure)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates look suspicious
 */
const isSuspiciousCoordinate = (lat, lng) => {
  // Check for exact [0, 0] or very close to it
  if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) {
    return true;
  }

  // Check for common default/test coordinates
  const commonDefaults = [
    { lat: 0, lng: 0 },
    { lat: 1, lng: 1 },
    { lat: 90, lng: 180 },
    { lat: -90, lng: -180 },
  ];

  for (const def of commonDefaults) {
    if (Math.abs(lat - def.lat) < 0.01 && Math.abs(lng - def.lng) < 0.01) {
      return true;
    }
  }

  return false;
};

/**
 * Get nearest major city to given coordinates (for user feedback)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Nearest city info
 */
const getNearestCity = (lat, lng) => {
  let nearest = null;
  let minDistance = Infinity;

  for (const [, city] of Object.entries(MAJOR_CITIES)) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...city, distance };
    }
  }

  return nearest;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Comprehensive coordinate validation with helpful error messages
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Validation result
 */
const validateCoordinatesWithFeedback = (lat, lng) => {
  try {
    // Basic validation
    validateEthiopianCoordinates(lat, lng);

    // Check for suspicious coordinates
    if (isSuspiciousCoordinate(lat, lng)) {
      return {
        valid: false,
        error: 'These coordinates look suspicious. Please check your GPS signal and try again.',
        suggestion: 'Move to an open area with clear sky view for better GPS accuracy.',
      };
    }

    // Get nearest city for confirmation
    const nearestCity = getNearestCity(lat, lng);

    return {
      valid: true,
      nearestCity: nearestCity.name,
      distanceToCity: Math.round(nearestCity.distance),
      message: `Location confirmed: ${Math.round(nearestCity.distance)}km from ${nearestCity.name}`,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      suggestion: 'Please check your coordinates and try again.',
    };
  }
};

/**
 * Validate GeoJSON polygon is within Ethiopia
 * @param {Object} polygon - GeoJSON polygon
 * @throws {Error} If polygon is invalid or outside Ethiopia
 * @returns {boolean} True if valid
 */
const validatePolygon = (polygon) => {
  if (!polygon || !polygon.type || !polygon.coordinates) {
    throw new Error('Invalid GeoJSON polygon structure');
  }

  if (polygon.type !== 'Polygon') {
    throw new Error(`Expected Polygon type, got ${polygon.type}`);
  }

  // Validate all vertices are within Ethiopia
  const coordinates = polygon.coordinates[0]; // Outer ring

  for (let i = 0; i < coordinates.length; i++) {
    const [lng, lat] = coordinates[i];
    try {
      validateEthiopianCoordinates(lat, lng);
    } catch (error) {
      throw new Error(`Polygon vertex ${i + 1} is outside Ethiopia: ${error.message}`);
    }
  }

  return true;
};

module.exports = {
  validateEthiopianCoordinates,
  validateFarmSize,
  isSuspiciousCoordinate,
  getNearestCity,
  calculateDistance,
  validateCoordinatesWithFeedback,
  validatePolygon,
  ETHIOPIA_BOUNDS,
  MAJOR_CITIES,
};
