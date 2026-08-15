const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');

router.get('/summary', controller.getSummary);
router.get('/regional', controller.getRegionalAnalytics);
router.get('/', controller.getSummary);

module.exports = router;
