const axios = require('axios');
const logger = require('../../utils/logger');

const openElevationConnector = {
  name: 'OPEN_ELEVATION',
  
  async fetchElevation({ lat, lng }) {
    try {
      const response = await axios.get(process.env.OPEN_ELEVATION_URL || 'https://api.open-elevation.com/api/v1/lookup', {
        params: {
          locations: `${lat},${lng}`
        },
        timeout: 10000
      });

      const results = response.data?.results || [];
      if (results.length > 0) {
        return {
          source: 'OPEN_ELEVATION',
          lat: results[0].latitude,
          lng: results[0].longitude,
          elevation: results[0].elevation,
          unit: 'meters'
        };
      }
      
      throw new Error('No elevation data returned');
    } catch (err) {
      logger.warn(`[OpenElevation] Failed for lat=${lat}, lng=${lng}: ${err.message}`);
      
      const elevationEstimate = 1500 + Math.round((lat - 9) * 200 + (lng - 38) * 150);
      return {
        source: 'ELEVATION_ESTIMATE',
        lat,
        lng,
        elevation: elevationEstimate,
        unit: 'meters'
      };
    }
  },
  
  async fetchMultipleElevations(locations) {
    try {
      const locString = locations.map(loc => `${loc.lat},${loc.lng}`).join('|');
      const response = await axios.get(process.env.OPEN_ELEVATION_URL || 'https://api.open-elevation.com/api/v1/lookup', {
        params: {
          locations: locString
        },
        timeout: 15000
      });

      return (response.data?.results || []).map(r => ({
        source: 'OPEN_ELEVATION',
        lat: r.latitude,
        lng: r.longitude,
        elevation: r.elevation,
        unit: 'meters'
      }));
    } catch (err) {
      logger.error(`[OpenElevation] Bulk fetch failed: ${err.message}`);
      return locations.map(loc => ({
        source: 'ELEVATION_ESTIMATE',
        ...loc,
        elevation: 1500 + Math.round((loc.lat - 9) * 200),
        unit: 'meters'
      }));
    }
  }
};

module.exports = openElevationConnector;
