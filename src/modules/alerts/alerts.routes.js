const express = require('express');
const router = express.Router();
const controller = require('./alerts.controller');

router.post('/', controller.createAlert);
router.get('/', controller.getAlerts);
router.get('/active', controller.getAlerts);

module.exports = router;
