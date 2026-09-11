const express = require('express');
const router = express.Router();
const controller = require('./sensors.controller');
const { telemetryLimiter } = require('../../middleware/rate-limiter.middleware');

// authenticateSensor is now maintained in the unified auth middleware
const { authenticate, authenticateSensor } = require('../../middleware/auth.middleware');

const service = require('./sensors.service');



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

module.exports = router;
