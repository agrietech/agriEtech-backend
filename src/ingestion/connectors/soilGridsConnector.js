const axios = require('axios');
const logger = require('../../utils/logger');

const soilGridsConnector = {
  name: 'SOILGRIDS',
  
  async fetchSoilProperties({ lat, lng, properties = ['clay', 'phh2o', 'soc', 'nitrogen'], depths = ['0-5cm', '5-15cm'] }) {
    try {
      const response = await axios.get(process.env.SOILGRIDS_URL || 'https://rest.isric.org/soilgrids/v2.0/properties/query', {
        params: {
          lon: lng,
          lat: lat,
          property: properties,
          depth: depths[0],
          value: 'mean'
        },
        timeout: 15000
      });

      const props = response.data?.properties || {};
      const layers = props.layers || [];
      
      const soilData = {};
      properties.forEach(prop => {
        const layer = layers.find(l => l.name === prop);
        if (layer && layer.depths && layer.depths[0]) {
          soilData[prop] = {
            value: layer.depths[0].values?.mean || null,
            unit: layer.unit_measure?.mapped_units || ''
          };
        }
      });

      return {
        source: 'SOILGRIDS',
        lat,
        lng,
        depth: depths[0],
        properties: soilData,
        raw: response.data
      };
    } catch (err) {
      logger.error(`[SoilGrids] Failed for lat=${lat}, lng=${lng}: ${err.message}`);
      
      return {
        source: 'SOILGRIDS_FALLBACK',
        lat,
        lng,
        properties: {
          clay: { value: 28, unit: '%' },
          phh2o: { value: 6.5, unit: 'pH' },
          soc: { value: 15, unit: 'g/kg' }
        }
      };
    }
  }
};

module.exports = soilGridsConnector;
