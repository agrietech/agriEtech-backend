const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const analyticsRoles = ['WOREDA_OFFICER', 'RESEARCHER', 'ADMIN'];

router.use(authenticate, authorize(...analyticsRoles));

router.get('/woredas/:woredaId/summary', controller.getWoredaSummary);
router.get('/regions/:regionId/summary', controller.getRegionalSummary);
router.get('/summary', controller.getSummary);
router.get('/regional', controller.getRegionalAnalytics);
router.get('/', controller.getSummary);

module.exports = router;
