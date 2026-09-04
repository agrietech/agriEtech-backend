const express = require('express');
const router = express.Router();
const controller = require('./ingestion.controller');

const { authenticate, authorize } = require('../middleware/auth.middleware');
const { telemetryLimiter } = require('../middleware/rate-limiter.middleware');
const { authenticateSensor } = require('../modules/sensors/sensors.routes');

router.get('/connectors', authenticate, authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER'), controller.getConnectorsList);
router.get('/health', authenticate, authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER'), controller.testConnectorHealth);
router.post('/pull', authenticate, authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER'), controller.triggerPull);
router.post('/trigger', authenticate, authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER'), controller.triggerPull);
router.post('/telemetry', authenticateSensor, telemetryLimiter, controller.ingestTelemetry);
router.get('/sync-logs', authenticate, authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER'), controller.getSyncLogs);
router.get('/queue/stats', authenticate, authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER'), controller.getQueueStats);
router.post('/jobs/:jobId/retry', authenticate, authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER'), controller.retryJob);

module.exports = router;
