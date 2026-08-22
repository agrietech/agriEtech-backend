const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * Normalizes analog soil moisture readings into percentage if raw ADC value detected.
 * Standard Arduino ADC (0-1023) or ESP32 ADC (0-4095)
 */
function normalizeSoilMoisture(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return null;
  const num = Number(val);
  
  // If value is between 0 and 100, treat as direct percentage
  if (num >= 0 && num <= 100) {
    return Math.round(num * 10) / 10;
  }

  // If standard 10-bit Arduino ADC (0-1023) where air is ~1023 and water is ~300
  if (num > 100 && num <= 1024) {
    const pct = ((1023 - num) / (1023 - 300)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
  }

  // If 12-bit ESP32 ADC (0-4095) where air is ~3000 and water is ~1500
  if (num > 1024 && num <= 4095) {
    const pct = ((3000 - num) / (3000 - 1500)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
  }

  return Math.min(100, Math.max(0, num));
}

class FirebaseSensorConnector {
  constructor(config = {}) {
    this.name = 'Firebase Arduino Sensor Connector';
    this.baseUrl = config.baseUrl || env.FIREBASE_DATABASE_URL || 'https://arduinomoisture-default-rtdb.firebaseio.com';
    this.apiKey = config.apiKey || env.FIREBASE_API_KEY || 'AIzaSyDt0I0HwHRlr1qpBHDh_fLlxmtXx3OqVG0';
    this.timeoutMs = config.timeoutMs || 15000;
  }

  /**
   * Build complete endpoint URL for Firebase RTDB REST API
   */
  buildEndpointUrl(customPath, customApiKey) {
    let base = (this.baseUrl || '').trim().replace(/\/+$/, '');
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }

    let subPath = customPath ? customPath.trim() : '';
    if (subPath && !subPath.startsWith('/')) {
      subPath = `/${subPath}`;
    }
    if (!subPath) {
      subPath = '/';
    }

    // Ensure endpoint ends with .json if accessing Firebase RTDB
    let url = `${base}${subPath}`;
    if (!url.endsWith('.json') && !url.includes('.json?')) {
      if (url.endsWith('/')) {
        url = `${url}.json`;
      } else {
        url = `${url}.json`;
      }
    }

    const key = customApiKey || this.apiKey;
    if (key && !url.includes('auth=')) {
      url += url.includes('?') ? `&auth=${key}` : `?auth=${key}`;
    }

    return url;
  }

  /**
   * Test connectivity to Firebase Realtime Database
   */
  async testConnection(customPath) {
    const targetUrl = this.buildEndpointUrl(customPath);
    try {
      logger.info(`[FirebaseSensorConnector] Probing Firebase RTDB endpoint: ${targetUrl.split('?')[0]}`);
      const response = await axios.get(targetUrl, { timeout: this.timeoutMs });
      return {
        success: true,
        endpoint: targetUrl.split('?')[0],
        status: response.status,
        hasData: response.data !== null && response.data !== undefined,
        dataPreview: response.data,
      };
    } catch (error) {
      const statusCode = error.response?.status || 500;
      const errorData = error.response?.data || error.message;
      logger.warn(`[FirebaseSensorConnector] Connection check returned status ${statusCode}:`, errorData);
      return {
        success: false,
        endpoint: targetUrl.split('?')[0],
        statusCode,
        error: errorData,
      };
    }
  }

  /**
   * Fetch and parse sensor telemetry readings from Firebase RTDB
   */
  async fetchTelemetry({ path, firebaseUrl, apiKey, defaultHardwareId = 'ARDUINO-MOISTURE-01' } = {}) {
    if (firebaseUrl) this.baseUrl = firebaseUrl;
    if (apiKey) this.apiKey = apiKey;

    // Check multiple candidate endpoints if path is not explicitly set
    const candidatePaths = path ? [path] : ['', '/sensors', '/moisture', '/readings', '/data', '/arduino'];
    let lastError = null;
    let rawData = null;
    let matchedEndpoint = null;

    for (const p of candidatePaths) {
      const endpoint = this.buildEndpointUrl(p);
      try {
        const response = await axios.get(endpoint, { timeout: this.timeoutMs });
        if (response.data !== null && response.data !== undefined) {
          rawData = response.data;
          matchedEndpoint = endpoint.split('?')[0];
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (rawData === null || rawData === undefined) {
      if (lastError) {
        const status = lastError.response?.status;
        const msg = lastError.response?.data?.error || lastError.message;
        throw new Error(`Firebase RTDB request failed (${status || 'Network Error'}): ${msg}`);
      }
      return {
        success: true,
        endpoint: matchedEndpoint || this.baseUrl,
        readings: [],
        message: 'Firebase Realtime Database is empty or no sensor records found at query path',
      };
    }

    // Parse records into standardized list
    const parsedRecords = this.parseRawData(rawData, defaultHardwareId);

    return {
      success: true,
      endpoint: matchedEndpoint,
      count: parsedRecords.length,
      readings: parsedRecords,
      rawSummary: typeof rawData === 'object' ? Object.keys(rawData).length : 1,
    };
  }

  /**
   * Parse heterogeneous JSON responses from Arduino / Firebase RTDB
   */
  parseRawData(rawData, defaultHwId = 'ARDUINO-MOISTURE-01') {
    const list = [];

    if (Array.isArray(rawData)) {
      for (const item of rawData) {
        if (item && typeof item === 'object') {
          list.push(this.standardizePayload(item, defaultHwId));
        }
      }
    } else if (rawData && typeof rawData === 'object') {
      // Check if it's a single reading object (e.g. { moisture: 45, temp: 22 })
      const isSingleReading =
        'moisture' in rawData ||
        'soilMoisture' in rawData ||
        'soil_moisture' in rawData ||
        'temperature' in rawData ||
        'temp' in rawData ||
        'analog' in rawData ||
        'val' in rawData;

      if (isSingleReading) {
        list.push(this.standardizePayload(rawData, defaultHwId));
      } else {
        // Firebase Push ID map: { "-Nx123": { moisture: 40 }, "-Nx124": { moisture: 42 } }
        for (const [key, val] of Object.entries(rawData)) {
          if (val && typeof val === 'object') {
            const hwId = val.hardwareId || val.deviceId || val.sensorId || val.device_id || key;
            list.push(this.standardizePayload({ ...val, hardwareId: hwId }, defaultHwId));
          } else if (typeof val === 'number') {
            // Flat key-value like { "moisture": 45 } or { "sensor1": 420 }
            list.push(
              this.standardizePayload(
                { hardwareId: key, soilMoisture: val },
                defaultHwId
              )
            );
          }
        }
      }
    } else if (typeof rawData === 'number') {
      // Direct scalar reading
      list.push(this.standardizePayload({ soilMoisture: rawData }, defaultHwId));
    }

    return list;
  }

  /**
   * Standardize field names across multiple naming conventions
   */
  standardizePayload(item, defaultHwId) {
    const rawMoisture =
      item.soilMoisture ??
      item.moisture ??
      item.soil_moisture ??
      item.soilMoisturePct ??
      item.val ??
      item.value ??
      item.raw ??
      item.analog;

    const soilMoisture = normalizeSoilMoisture(rawMoisture);

    const soilTemp =
      item.soilTemp !== undefined
        ? Number(item.soilTemp)
        : item.soil_temp !== undefined
        ? Number(item.soil_temp)
        : item.soil_temperature !== undefined
        ? Number(item.soil_temperature)
        : null;

    const ambientTemp =
      item.ambientTemp !== undefined
        ? Number(item.ambientTemp)
        : item.temperature !== undefined
        ? Number(item.temperature)
        : item.temp !== undefined
        ? Number(item.temp)
        : item.airTemp !== undefined
        ? Number(item.airTemp)
        : null;

    const humidity =
      item.humidity !== undefined
        ? Number(item.humidity)
        : item.relative_humidity !== undefined
        ? Number(item.relative_humidity)
        : item.rh !== undefined
        ? Number(item.rh)
        : null;

    const rainfallMm =
      item.rainfallMm !== undefined
        ? Number(item.rainfallMm)
        : item.rainfall !== undefined
        ? Number(item.rainfall)
        : item.rain !== undefined
        ? Number(item.rain)
        : null;

    const batteryLevel =
      item.batteryLevel !== undefined
        ? Number(item.batteryLevel)
        : item.battery !== undefined
        ? Number(item.battery)
        : item.battery_pct !== undefined
        ? Number(item.battery_pct)
        : item.batt !== undefined
        ? Number(item.batt)
        : null;

    const recordedAt = item.timestamp || item.recordedAt || item.created_at || item.time || new Date().toISOString();

    const hardwareId =
      item.hardwareId ||
      item.hardware_id ||
      item.deviceId ||
      item.device_id ||
      item.sensorId ||
      item.sensor_id ||
      item.serialNumber ||
      defaultHwId;

    return {
      hardwareId: String(hardwareId),
      farmId: item.farmId || item.farm_id || null,
      soilMoisture,
      soilTemp: !isNaN(soilTemp) ? soilTemp : null,
      ambientTemp: !isNaN(ambientTemp) ? ambientTemp : null,
      humidity: !isNaN(humidity) ? humidity : null,
      rainfallMm: !isNaN(rainfallMm) ? rainfallMm : null,
      batteryLevel: !isNaN(batteryLevel) ? batteryLevel : null,
      recordedAt: new Date(recordedAt),
      raw: item,
    };
  }
}

module.exports = {
  FirebaseSensorConnector,
  normalizeSoilMoisture,
};
