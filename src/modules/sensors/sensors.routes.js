const express = require('express');
const router = express.Router();
const controller = require('./sensors.controller');
const { telemetryLimiter } = require('../../middleware/rate-limiter.middleware');

const { authenticate, authorize } = require('../../middleware/auth.middleware');

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
router.get('/farm/:farmId', authenticate, controller.getSensors);
router.post('/', authenticate, authorize('DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'ADMIN'), controller.registerSensor);
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

module.exports = router;
