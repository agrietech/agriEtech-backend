const express = require('express');
const router = express.Router();
const controller = require('./ingestion.controller');

router.get('/connectors', controller.getConnectorsList);
router.get('/health', controller.testConnectorHealth);
router.post('/pull', controller.triggerPull);
router.post('/trigger', controller.triggerPull);
router.post('/telemetry', controller.ingestTelemetry);

module.exports = router;
