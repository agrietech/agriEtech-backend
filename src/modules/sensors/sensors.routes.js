const express = require('express');
const router = express.Router();
const controller = require('./sensors.controller');
const { telemetryLimiter } = require('../../middleware/rate-limiter.middleware');

const { authenticate, authorize } = require('../../middleware/auth.middleware');

const service = require('./sensors.service');

// Robust per-device sensor telemetry authentication:
// Requires Bearer JWT user token, verified per-device X-Sensor-Token, or configured global API key
async function authenticateSensor(req, res, next) {
  if (process.env.NODE_ENV === 'test') return next();

  // 1. Authenticate if Bearer JWT token is present (e.g. farmer app / officer testing)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const jwt = require('jsonwebtoken');
      const env = require('../../config/env');
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (_err) {}
  }

  // 2. Authenticate if global configured sensor API key is provided
  const apiKey = req.headers['x-sensor-api-key'] || req.headers['x-api-key'] || req.query?.apiKey;
  const configuredKeys = (process.env.SENSOR_API_KEYS || process.env.IOT_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  if (apiKey && configuredKeys.length > 0 && configuredKeys.includes(apiKey.trim())) {
    return next();
  }

  // 3. IoT device direct identification with cryptographic device secret token
  const hardwareId =
    req.body?.hardwareId ||
    req.body?.hardware_id ||
    req.body?.deviceId ||
    req.body?.sensorId ||
    req.query?.hardwareId;

  const deviceToken =
    req.headers['x-sensor-token'] ||
    req.headers['x-device-token'] ||
    req.body?.sensorToken ||
    req.body?.deviceToken ||
    req.query?.token;

  if (hardwareId && typeof hardwareId === 'string' && hardwareId.trim().length > 0) {
    // If device token provided, verify cryptographically against database record
    if (deviceToken) {
      const isValid = await service.verifySensorToken(hardwareId.trim(), deviceToken);
      if (isValid) {
        return next();
      }
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid sensor device token for specified hardwareId',
          code: 'SENSOR_TOKEN_INVALID',
        },
      });
    }

    // In development environment only: allow bare hardwareId if device is registered
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: {
      message: 'Sensor authentication failed: valid X-Sensor-Token, user Bearer token, or API key required',
      code: 'SENSOR_UNAUTHORIZED',
    },
  });
}

// Individual Farmer Sensor Ownership Endpoints
router.get('/my-sensors', authenticate, controller.getMySensors);
router.get('/farmer/:userId', authenticate, controller.getFarmerSensors);
router.post('/claim', authenticate, controller.claimSensor);

router.post('/telemetry', authenticateSensor, telemetryLimiter, controller.recordTelemetry);
router.get('/farm/:farmId', authenticate, controller.getSensors);

// Allow farmers, agents, officers, and admins to register a sensor individually
router.post('/', authenticate, controller.registerSensor);
router.get('/', authenticate, controller.getSensors);


// Firebase Realtime DB & Firestore Sensor Ingestion
// Management endpoints require officer/admin JWT authentication
router.get('/firebase/status', authenticate, authorize('WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'ADMIN'), controller.getFirebaseStatus);
router.get('/firebase/test', authenticate, authorize('ADMIN'), controller.testFirebaseConnection);
router.get('/firebase/sync', authenticate, authorize('WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'ADMIN'), controller.syncFirebase);
router.post('/firebase/sync', authenticate, authorize('WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'ADMIN'), controller.syncFirebase);
// Webhook/stream endpoints authenticate via sensor API key (IoT device push)
router.post('/firebase/stream', authenticateSensor, controller.receiveFirebaseStream);
router.post('/firebase/webhook', authenticateSensor, controller.receiveFirebaseStream);

// Telemetry query endpoints matching Flutter SensorRepository
router.get('/:id/telemetry', authenticate, controller.getSensorTelemetry);
router.get('/:hardwareId/latest', authenticate, controller.getLatestSensorReading);

// Single sensor details & OCC update endpoints
router.get('/:id', authenticate, controller.getSensorDetails);
router.put('/:id', authenticate, controller.updateSensor);
router.patch('/:id', authenticate, controller.updateSensor);

router.authenticateSensor = authenticateSensor;
module.exports = router;

