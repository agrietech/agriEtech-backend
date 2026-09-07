const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');
const { authenticate, optionalAuthenticate, authorize, authorizeWoredaScope, authorizeZoneScope, authorizeRegionScope } = require('../../middleware/auth.middleware');

router.get('/dashboard', authenticate, controller.getDashboardSummary);
router.get('/dashboard-summary', authenticate, controller.getDashboardSummary);
router.get('/summary', authenticate, controller.getDashboardSummary);
router.get('/regional-breakdown', authenticate, controller.getRegionalBreakdown);
router.get('/regional', authenticate, controller.getRegionalBreakdown);
router.get('/temporal-trends', authenticate, controller.getTemporalTrends);
router.get('/agronomic-advisories', authenticate, controller.getAgronomicAdvisories);
router.post('/ai-insights', authenticate, controller.getAiInsights);
router.get('/export', authenticate, authorize('RESEARCHER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'WOREDA_OFFICER', 'ADMIN'), controller.exportData);

// Coordinate-Specific Hyper-Local Agronomy & Digital Soil Engine
router.get('/hyper-local', optionalAuthenticate, controller.getHyperLocalProfile);
router.get('/soil-profile', optionalAuthenticate, controller.getSoilProfile);
router.get('/downscaled-forecast', optionalAuthenticate, controller.getDownscaledForecast);
router.get('/agro-zone', optionalAuthenticate, controller.getAgroZone);

// Integrated Risk Natural Disasters, Seismology & Soil Degradation Engines
router.get('/seismology', optionalAuthenticate, controller.getSeismologyAnalytics);
router.get('/earthquakes', optionalAuthenticate, controller.getSeismologyAnalytics);
router.get('/soil-degradation', optionalAuthenticate, controller.getSoilDegradationAnalytics);
router.get('/land-loss', optionalAuthenticate, controller.getSoilDegradationAnalytics);
router.get('/natural-disasters', optionalAuthenticate, controller.getNaturalDisastersPrediction);
router.get('/disaster-predictions', optionalAuthenticate, controller.getNaturalDisastersPrediction);

// Location-specific map and analytics endpoints
router.get('/location/map', authenticate, controller.getLocationMap);
router.get('/location/analytics', authenticate, controller.getLocationAnalytics);
router.get('/region/:regionId/map', authenticate, authorizeRegionScope('regionId'), controller.getRegionMap);
router.get('/region/:regionId/analytics', authenticate, authorizeRegionScope('regionId'), controller.getRegionAnalytics);
router.get('/zone/:zoneId/map', authenticate, authorizeZoneScope('zoneId'), controller.getZoneMap);
router.get('/zone/:zoneId/analytics', authenticate, authorizeZoneScope('zoneId'), controller.getZoneAnalytics);
router.get('/woreda/:woredaId/map', authenticate, authorizeWoredaScope('woredaId'), controller.getWoredaMap);
router.get('/woreda/:woredaId/analytics', authenticate, authorizeWoredaScope('woredaId'), controller.getWoredaAnalytics);

router.get('/', authenticate, controller.getDashboardSummary);

module.exports = router;


