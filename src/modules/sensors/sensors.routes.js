const express = require('express');
const router = express.Router();
const controller = require('./sensors.controller');

router.post('/telemetry', controller.recordTelemetry);
router.get('/farm/:farmId', controller.getSensors);
router.post('/', controller.registerSensor);
router.get('/', controller.getSensors);

module.exports = router;
