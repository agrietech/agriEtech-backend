const express = require('express');
const router = express.Router();
const controller = require('./alerts.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Protected routes — all alert operations require authentication
router.post('/', authenticate, controller.createAlert);
router.get('/', authenticate, controller.getAlerts);
router.get('/active', authenticate, controller.getAlerts);
router.get('/:id', authenticate, controller.getAlertById);
router.patch('/:id/read', authenticate, controller.markAlertAsRead);

module.exports = router;
