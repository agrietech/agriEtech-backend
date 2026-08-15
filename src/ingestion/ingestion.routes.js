const express = require('express');
const router = express.Router();
const controller = require('./ingestion.controller');

router.get('/connectors', controller.getConnectorsList);
router.post('/trigger', controller.triggerPull);
router.post('/telemetry', controller.ingestTelemetry);

module.exports = router;
