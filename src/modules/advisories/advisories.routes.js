const express = require('express');
const router = express.Router();
const controller = require('./advisories.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Public/authenticated queries
router.get('/', authenticate, controller.getAdvisories);
router.get('/:id', authenticate, controller.getAdvisoryById);

// Staff-only management routes
router.post(
  '/',
  authenticate,
  authorize('DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'RESEARCHER', 'ADMIN'),
  controller.createAdvisory
);

router.put(
  '/:id',
  authenticate,
  authorize('WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'ADMIN'),
  controller.updateAdvisory
);

router.delete(
  '/:id',
  authenticate,
  authorize('REGIONAL_OFFICER', 'ADMIN'),
  controller.deleteAdvisory
);

module.exports = router;
