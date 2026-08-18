const express = require('express');
const router = express.Router();
const controller = require('./riskAssessments.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/evaluate', authenticate, controller.evaluateRisk);
router.get('/statistics', authenticate, controller.getStatistics);
router.get('/woreda/:woredaId', authenticate, controller.getWoredaAssessments);
router.get('/latest', authenticate, controller.getLatestAssessments);
router.get('/', authenticate, controller.getLatestAssessments);

module.exports = router;
