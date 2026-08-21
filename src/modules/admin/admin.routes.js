const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');
const roleRequestController = require('../roleRequest/roleRequest.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Admin authentication middleware (Requires ADMIN role via JWT, with explicit opt-in dev bypass)
const adminAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'test' || process.env.ADMIN_DEV_BYPASS === 'true') {
    if (!req.user) req.user = { id: 'usr_admin_01', email: 'admin@agrietech.et', role: 'ADMIN' };
    return next();
  }
  return authenticate(req, res, () => {
    return authorize('ADMIN')(req, res, next);
  });
};

// Public dashboard console view (serves HTML admin interface)
router.get('/', adminAuth, (_req, res) => res.redirect('/api/v1/admin/dashboard'));
router.get('/dashboard', adminAuth, controller.renderDashboard);

// Admin Operations & Diagnostics Endpoints
router.get('/overview', adminAuth, controller.getOverview);

// User Management Routes
router.get('/users', adminAuth, controller.getUsers);
router.post('/users', adminAuth, controller.createUser);
router.put('/users/:id', adminAuth, controller.updateUser);
router.patch('/users/:id/role', adminAuth, controller.updateUserRole);
router.patch('/users/:id/status', adminAuth, controller.updateUserStatus);
router.delete('/users/:id', adminAuth, controller.deleteUser);

// Farm Management Routes
router.get('/farms', adminAuth, controller.getFarms);
router.post('/farms', adminAuth, controller.createFarm);
router.put('/farms/:id', adminAuth, controller.updateFarm);
router.delete('/farms/:id', adminAuth, controller.deleteFarm);

// Sensor Management Routes
router.get('/sensors', adminAuth, controller.getSensors);
router.post('/sensors', adminAuth, controller.createSensor);
router.delete('/sensors/:id', adminAuth, controller.deleteSensor);

// Alert Management & Emergency Broadcast
router.get('/alerts', adminAuth, controller.getAlerts);
router.post('/broadcast-alert', adminAuth, controller.broadcastEmergencyAlert);
router.delete('/alerts/:id', adminAuth, controller.deleteAlert);

// Disease Diagnosis Management
router.get('/diagnoses', adminAuth, controller.getDiagnoses);
router.delete('/diagnoses/:id', adminAuth, controller.deleteDiagnosis);

// System Health, Ingestion Trigger & Audit Logs
router.get('/system/health', adminAuth, controller.getSystemHealth);
router.get('/health', adminAuth, controller.getSystemHealth);
router.post('/ingestion/trigger', adminAuth, controller.triggerIngestion);
router.get('/audit-logs', adminAuth, controller.getAuditLogs);

// Role Request Management (Hierarchical Approval System)
router.get('/role-requests', adminAuth, roleRequestController.getPendingRequests);
router.get('/role-requests/stats', adminAuth, roleRequestController.getRoleRequestStats);
router.post('/role-requests/:id/approve', adminAuth, roleRequestController.approveRoleRequest);
router.post('/role-requests/:id/reject', adminAuth, roleRequestController.rejectRoleRequest);

module.exports = router;
