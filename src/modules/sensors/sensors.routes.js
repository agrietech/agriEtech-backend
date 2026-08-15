const express = require('express');
const router = express.Router();
const controller = require('./sensors.controller');

router.post('/', controller.registerSensor);
router.get('/', controller.getSensors);

module.exports = router;
