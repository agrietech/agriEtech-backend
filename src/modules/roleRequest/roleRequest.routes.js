const express = require('express');
const router = express.Router();
const controller = require('./roleRequest.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

/**
 * Role Request Routes
 * 
 * User-facing routes: /api/v1/auth/role-requests
 * Admin routes: /api/v1/admin/role-requests
 */

// User-facing routes (authenticated users)
router.post('/', authenticate, controller.submitRoleRequest);
router.get('/my-requests', authenticate, controller.getMyRoleRequests);

// Admin routes (require WOREDA_OFFICER or ADMIN role)
router.get(
  '/pending',
  authenticate,
  authorize('WOREDA_OFFICER', 'ADMIN'),
  controller.getPendingRequests
);

router.post(
  '/:id/approve',
  authenticate,
  authorize('WOREDA_OFFICER', 'ADMIN'),
  controller.approveRoleRequest
);

router.post(
  '/:id/reject',
  authenticate,
  authorize('WOREDA_OFFICER', 'ADMIN'),
  controller.rejectRoleRequest
);

router.get('/stats', authenticate, authorize('ADMIN'), controller.getRoleRequestStats);

module.exports = router;
