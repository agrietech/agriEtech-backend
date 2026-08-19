const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/dashboard', authenticate, controller.getDashboardSummary);
router.get('/summary', authenticate, controller.getDashboardSummary);
router.get('/regional-breakdown', authenticate, controller.getRegionalBreakdown);
router.get('/regional', authenticate, controller.getRegionalBreakdown);
router.get('/temporal-trends', authenticate, controller.getTemporalTrends);
router.get('/agronomic-advisories', authenticate, controller.getAgronomicAdvisories);
router.post('/ai-insights', authenticate, controller.getAiInsights);
router.get('/', authenticate, controller.getDashboardSummary);

module.exports = router;
