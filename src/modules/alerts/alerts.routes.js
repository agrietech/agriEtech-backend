const express = require('express');
const router = express.Router();
const controller = require('./alerts.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Protected routes — all alert operations require authentication
router.post(
  '/',
  authenticate,
  authorize('DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'ADMIN'),
  controller.createAlert
);
router.get('/', authenticate, controller.getAlerts);
router.get('/active', authenticate, controller.getAlerts);
router.get('/:id', authenticate, controller.getAlertById);
router.patch('/:id/read', authenticate, controller.markAlertAsRead);

// Ground-truth feedback: farmers can validate whether an alert was accurate
router.post('/:id/feedback', authenticate, controller.submitFeedback);

module.exports = router;
