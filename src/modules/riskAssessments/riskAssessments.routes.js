const express = require('express');
const router = express.Router();
const controller = require('./riskAssessments.controller');

router.post('/evaluate', controller.evaluateRisk);
router.get('/latest', controller.getLatestAssessments);
router.get('/', controller.getLatestAssessments);

module.exports = router;
