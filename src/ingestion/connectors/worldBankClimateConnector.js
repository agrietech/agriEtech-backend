const axios = require('axios');
const logger = require('../../utils/logger');

const worldBankClimateConnector = {
  name: 'WORLD_BANK_CLIMATE',
  
  async fetchHistoricalTemperature({ countryCode = 'ETH', startYear, endYear }) {
    try {
      const url = `${process.env.WORLD_BANK_CLIMATE_URL || 'https://climatedataapi.worldbank.org/climateweb/rest/v1'}/country/cru/tas/year/${countryCode}`;
      
      const response = await axios.get(url, {
        timeout: 20000
      });

      let data = response.data || [];
      
      if (startYear || endYear) {
        data = data.filter(d => {
          const year = d.year;
          if (startYear && year < startYear) return false;
          if (endYear && year > endYear) return false;
          return true;
        });
      }

      return {
        source: 'WORLD_BANK_CLIMATE',
        countryCode,
        dataPoints: data.length,
        data: data.map(d => ({
          year: d.year,
          temperature: d.data,
          unit: 'Celsius'
        })),
        latestYear: data.length > 0 ? data[data.length - 1].year : null,
        latestTemp: data.length > 0 ? data[data.length - 1].data : null
      };
    } catch (err) {
      logger.error(`[WorldBankClimate] Failed for ${countryCode}: ${err.message}`);
      throw err;
    }
  },
  
  async fetchHistoricalPrecipitation({ countryCode = 'ETH', startYear, endYear }) {
    try {
      const url = `${process.env.WORLD_BANK_CLIMATE_URL || 'https://climatedataapi.worldbank.org/climateweb/rest/v1'}/country/cru/pr/year/${countryCode}`;
      
      const response = await axios.get(url, {
        timeout: 20000
      });

      let data = response.data || [];
      
      if (startYear || endYear) {
        data = data.filter(d => {
          const year = d.year;
          if (startYear && year < startYear) return false;
          if (endYear && year > endYear) return false;
          return true;
        });
      }

      return {
        source: 'WORLD_BANK_CLIMATE',
        countryCode,
        dataPoints: data.length,
        data: data.map(d => ({
          year: d.year,
          precipitation: d.data,
          unit: 'mm'
        })),
        latestYear: data.length > 0 ? data[data.length - 1].year : null,
        latestPrecip: data.length > 0 ? data[data.length - 1].data : null
      };
    } catch (err) {
      logger.error(`[WorldBankClimate] Precipitation failed for ${countryCode}: ${err.message}`);
      throw err;
    }
  }
};

module.exports = worldBankClimateConnector;
