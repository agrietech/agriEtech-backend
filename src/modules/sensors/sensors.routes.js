const express = require('express');
const router = express.Router();
const controller = require('./sensors.controller');
const { telemetryLimiter } = require('../../middleware/rateLimiter');

const { authenticate } = require('../../middleware/auth.middleware');

function authenticateSensor(req, res, next) {
  if (process.env.NODE_ENV === 'test') return next();
  const apiKey = req.headers['x-sensor-api-key'] || req.headers['x-api-key'];
  const configuredKeys = (process.env.SENSOR_API_KEYS || process.env.IOT_API_KEYS || 'agri-sensor-secret-key').split(',').map(k => k.trim());
  
  if (!apiKey || !configuredKeys.includes(apiKey.trim())) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or missing sensor API key', code: 'SENSOR_UNAUTHORIZED' }
    });
  }
  next();
}

// Individual Farmer Sensor Ownership Endpoints
router.get('/my-sensors', authenticate, controller.getMySensors);
router.get('/farmer/:userId', authenticate, controller.getFarmerSensors);
router.post('/claim', authenticate, controller.claimSensor);

router.post('/telemetry', authenticateSensor, telemetryLimiter, controller.recordTelemetry);
router.get('/farm/:farmId', controller.getSensors);
router.post('/', controller.registerSensor);
router.get('/', controller.getSensors);

// Firebase Realtime DB & Firestore Sensor Ingestion
router.get('/firebase/status', controller.getFirebaseStatus);
router.get('/firebase/test', controller.testFirebaseConnection);
router.get('/firebase/sync', controller.syncFirebase);
router.post('/firebase/sync', controller.syncFirebase);
router.post('/firebase/stream', controller.receiveFirebaseStream);
router.post('/firebase/webhook', controller.receiveFirebaseStream);

module.exports = router;
