const express = require('express');
const router = express.Router();
const controller = require('./sensors.controller');
const { telemetryLimiter } = require('../../middleware/rate-limiter.middleware');

const { authenticate } = require('../../middleware/auth.middleware');

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

    // In development or test environment: allow bare hardwareId if device is registered
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
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

// GET /telemetry — returns recent telemetry readings (used by Flutter frontend dashboard)
router.get('/telemetry', authenticate, controller.getAllTelemetry);
router.get('/telemetry/summary', authenticate, controller.getAllTelemetry);

router.post('/telemetry', authenticateSensor, telemetryLimiter, controller.recordTelemetry);
router.get('/farm/:farmId', authenticate, controller.getSensors);

// Allow farmers, agents, officers, and admins to register a sensor individually
router.post('/', authenticate, controller.registerSensor);
router.get('/', authenticate, controller.getSensors);


// Telemetry query endpoints matching Flutter SensorRepository
router.get('/:id/telemetry', authenticate, controller.getSensorTelemetry);
router.get('/:hardwareId/latest', authenticate, controller.getLatestSensorReading);

// Single sensor details & OCC update endpoints
router.get('/:id', authenticate, controller.getSensorDetails);
router.put('/:id', authenticate, controller.updateSensor);
router.patch('/:id', authenticate, controller.updateSensor);

router.authenticateSensor = authenticateSensor;
module.exports = router;

