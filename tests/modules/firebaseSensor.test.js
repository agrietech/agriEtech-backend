const request = require('supertest');
const axios = require('axios');
const app = require('../../src/app');
const { FirebaseSensorConnector, normalizeSoilMoisture } = require('../../src/ingestion/connectors/firebaseSensorConnector');
const sensorsService = require('../../src/modules/sensors/sensors.service');

// Mock axios for deterministic Firebase RTDB testing
jest.mock('axios');

describe('Firebase Realtime Database Sensor Integration Suite', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ADC & Soil Moisture Normalization Unit Tests', () => {
    it('should keep direct percentage values (0-100%) unchanged', () => {
      expect(normalizeSoilMoisture(45.2)).toBe(45.2);
      expect(normalizeSoilMoisture(0)).toBe(0);
      expect(normalizeSoilMoisture(100)).toBe(100);
    });

    it('should map 10-bit Arduino ADC values (0-1023) to soil moisture percentage', () => {
      // 1023 (dry air) -> 0%
      expect(normalizeSoilMoisture(1023)).toBe(0);
      // 300 (saturated water) -> 100%
      expect(normalizeSoilMoisture(300)).toBe(100);
      // intermediate value
      const mid = normalizeSoilMoisture(661);
      expect(mid).toBeGreaterThan(40);
      expect(mid).toBeLessThan(60);
    });

    it('should map 12-bit ESP32 ADC values (1024-4095) to soil moisture percentage', () => {
      // 3000 (air) -> 0%
      expect(normalizeSoilMoisture(3000)).toBe(0);
      // 1500 (water) -> 100%
      expect(normalizeSoilMoisture(1500)).toBe(100);
      // 2250 (mid) -> ~50%
      expect(normalizeSoilMoisture(2250)).toBe(50);
    });

    it('should handle null, undefined, and non-numeric inputs gracefully', () => {
      expect(normalizeSoilMoisture(null)).toBeNull();
      expect(normalizeSoilMoisture(undefined)).toBeNull();
      expect(normalizeSoilMoisture('invalid')).toBeNull();
    });
  });

  describe('FirebaseSensorConnector Unit Tests', () => {
    const connector = new FirebaseSensorConnector({
      baseUrl: 'https://arduinomoisture-default-rtdb.firebaseio.com',
      apiKey: 'AIzaSyDt0I0HwHRlr1qpBHDh_fLlxmtXx3OqVG0',
    });

    it('should construct valid Firebase RTDB REST endpoints with .json and auth params', () => {
      const url1 = connector.buildEndpointUrl();
      expect(url1).toBe('https://arduinomoisture-default-rtdb.firebaseio.com/.json?auth=AIzaSyDt0I0HwHRlr1qpBHDh_fLlxmtXx3OqVG0');

      const url2 = connector.buildEndpointUrl('/sensors/ARDUINO-01');
      expect(url2).toBe('https://arduinomoisture-default-rtdb.firebaseio.com/sensors/ARDUINO-01.json?auth=AIzaSyDt0I0HwHRlr1qpBHDh_fLlxmtXx3OqVG0');
    });

    it('should parse Firebase push-ID hash map payload', () => {
      const samplePushData = {
        '-NxA123456789': {
          hardwareId: 'ARDUINO-MOISTURE-01',
          soilMoisture: 38.5,
          soilTemp: 22.1,
          batteryLevel: 95,
        },
        '-NxA987654321': {
          hardwareId: 'ARDUINO-MOISTURE-02',
          soilMoisture: 55.0,
          soilTemp: 20.4,
          batteryLevel: 88,
        },
      };

      const parsed = connector.parseRawData(samplePushData);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].hardwareId).toBe('ARDUINO-MOISTURE-01');
      expect(parsed[0].soilMoisture).toBe(38.5);
      expect(parsed[1].hardwareId).toBe('ARDUINO-MOISTURE-02');
      expect(parsed[1].soilMoisture).toBe(55.0);
    });

    it('should parse single JSON sensor object payload with alternate key names', () => {
      const singleReading = {
        device_id: 'ESP32-SOIL-PROBE',
        moisture: 42.0,
        temp: 25.5,
        relative_humidity: 60.0,
        battery_pct: 99,
      };

      const parsed = connector.parseRawData(singleReading);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].hardwareId).toBe('ESP32-SOIL-PROBE');
      expect(parsed[0].soilMoisture).toBe(42.0);
      expect(parsed[0].ambientTemp).toBe(25.5);
      expect(parsed[0].humidity).toBe(60.0);
      expect(parsed[0].batteryLevel).toBe(99);
    });
  });

  describe('Sensors API - Firebase Endpoints Integration Tests', () => {
    it('GET /api/v1/sensors/firebase/status - should return current configured Firebase RTDB status', async () => {
      const res = await request(app).get('/api/v1/sensors/firebase/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('CONFIGURED');
      expect(res.body.databaseUrl).toContain('arduinomoisture-default-rtdb.firebaseio.com');
      expect(res.body.receiverEndpoints).toBeDefined();
    });

    it('POST /api/v1/sensors/firebase/stream - should accept and record real-time push stream telemetry', async () => {
      const res = await request(app)
        .post('/api/v1/sensors/firebase/stream')
        .send({
          hardwareId: 'ARDUINO-MOISTURE-01',
          soilMoisture: 47.8,
          soilTemp: 21.5,
          ambientTemp: 24.0,
          humidity: 65.0,
          batteryLevel: 94.0,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.soilMoisture).toBe(47.8);
      expect(res.body.data.soilTemp).toBe(21.5);
    });

    it('POST /api/v1/sensors/firebase/sync - should fetch and ingest readings from Firebase RTDB', async () => {
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          'sensor_01': {
            moisture: 39.5,
            temperature: 23.0,
            humidity: 58.0,
            battery: 92.0,
          },
        },
      });

      const res = await request(app)
        .post('/api/v1/sensors/firebase/sync')
        .send({
          firebaseUrl: 'https://arduinomoisture-default-rtdb.firebaseio.com',
          apiKey: 'AIzaSyDt0I0HwHRlr1qpBHDh_fLlxmtXx3OqVG0',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.readings[0].soilMoisture).toBe(39.5);
    });

    it('GET /api/v1/sensors/firebase/test - should probe Firebase RTDB and return diagnostics', async () => {
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: { test: 'ok' },
      });

      const res = await request(app).get('/api/v1/sensors/firebase/test');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.databaseUrl).toContain('arduinomoisture-default-rtdb.firebaseio.com');
      expect(res.body.diagnostics.hasData).toBe(true);
    });
  });
});
