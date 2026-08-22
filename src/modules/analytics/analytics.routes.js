const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/dashboard', authenticate, controller.getDashboardSummary);
router.get('/dashboard-summary', authenticate, controller.getDashboardSummary);
router.get('/summary', authenticate, controller.getDashboardSummary);
router.get('/regional-breakdown', authenticate, controller.getRegionalBreakdown);
router.get('/regional', authenticate, controller.getRegionalBreakdown);
router.get('/temporal-trends', authenticate, controller.getTemporalTrends);
router.get('/agronomic-advisories', authenticate, controller.getAgronomicAdvisories);
router.post('/ai-insights', authenticate, controller.getAiInsights);

// Location-specific map and analytics endpoints
router.get('/location/map', authenticate, controller.getLocationMap);
router.get('/location/analytics', authenticate, controller.getLocationAnalytics);
router.get('/region/:regionId/map', authenticate, controller.getRegionMap);
router.get('/region/:regionId/analytics', authenticate, controller.getRegionAnalytics);
router.get('/zone/:zoneId/map', authenticate, controller.getZoneMap);
router.get('/zone/:zoneId/analytics', authenticate, controller.getZoneAnalytics);
router.get('/woreda/:woredaId/map', authenticate, controller.getWoredaMap);
router.get('/woreda/:woredaId/analytics', authenticate, controller.getWoredaAnalytics);

router.get('/', authenticate, controller.getDashboardSummary);

module.exports = router;
