const express = require('express');
const router = express.Router();
const controller = require('./satelliteObservations.controller');
const ingestionController = require('../../ingestion/ingestion.controller');
const { authenticate, authorizeWoredaScope, authorize } = require('../../middleware/auth.middleware');

router.get('/woreda/:woredaId', authenticate, authorizeWoredaScope('woredaId'), controller.getObservations);
router.get('/', authenticate, authorizeWoredaScope('woredaId'), controller.getObservations);
router.post('/ingest', authenticate, authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER'), ingestionController.triggerPull);

module.exports = router;
