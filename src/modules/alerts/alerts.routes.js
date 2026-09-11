const express = require('express');
const router = express.Router();
const controller = require('./alerts.controller');
const { authenticate, authorize, authorizeWoredaScope } = require('../../middleware/auth.middleware');

// POST / — Create alert.
// authorize() enforces role (only officers/DAs can broadcast).
// authorizeWoredaScope() ensures the alert's target woreda is within the creator's
// assigned jurisdiction, preventing cross-jurisdiction alert spoofing.
router.post(
  '/',
  authenticate,
  authorize('DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'ADMIN'),
  authorizeWoredaScope('woredaId'),
  controller.createAlert
);

// GET routes — all authenticated users can view alerts scoped to their jurisdiction
router.get('/', authenticate, controller.getAlerts);
router.get('/active', authenticate, controller.getAlerts);
router.get('/:id', authenticate, controller.getAlertById);

// Mark read / feedback — any authenticated user (farmers responding to alerts)
router.patch('/:id/read', authenticate, controller.markAlertAsRead);
router.post('/:id/read', authenticate, controller.markAlertAsRead);

// Ground-truth feedback: farmers can validate whether an alert was accurate
router.post('/:id/feedback', authenticate, controller.submitFeedback);

module.exports = router;
