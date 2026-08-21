const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Public dashboard console view (serves HTML admin interface)
router.get('/', (_req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', controller.renderDashboard);

// In development or when explicitly requested, optional middleware or admin check
const adminAuth = process.env.NODE_ENV === 'test' ? (req, _res, next) => {
  if (!req.user) req.user = { id: 'usr_admin_01', email: 'admin@agrietech.et', role: 'ADMIN' };
  next();
} : (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader && process.env.NODE_ENV !== 'production') {
    req.user = { id: 'usr_admin_01', email: 'admin@agrietech.et', role: 'ADMIN' };
    return next();
  }
  return authenticate(req, res, () => {
    return authorize('ADMIN')(req, res, next);
  });
};

// Admin Operations & Diagnostics Endpoints
router.get('/overview', adminAuth, controller.getOverview);

// User CRUD
router.get('/users', adminAuth, controller.getUsers);
router.post('/users', adminAuth, controller.createUser);
router.put('/users/:id', adminAuth, controller.updateUser);
router.patch('/users/:id/role', adminAuth, controller.updateUserRole);
router.patch('/users/:id/status', adminAuth, controller.updateUserStatus);
router.delete('/users/:id', adminAuth, controller.deleteUser);

// Farm CRUD
router.get('/farms', adminAuth, controller.getFarms);
router.post('/farms', adminAuth, controller.createFarm);
router.put('/farms/:id', adminAuth, controller.updateFarm);
router.delete('/farms/:id', adminAuth, controller.deleteFarm);

// Sensor CRUD
router.get('/sensors', adminAuth, controller.getSensors);
router.post('/sensors', adminAuth, controller.createSensor);
router.delete('/sensors/:id', adminAuth, controller.deleteSensor);

// Alert CRUD & Emergency Broadcast
router.get('/alerts', adminAuth, controller.getAlerts);
router.post('/broadcast-alert', adminAuth, controller.broadcastEmergencyAlert);
router.delete('/alerts/:id', adminAuth, controller.deleteAlert);

// Disease Diagnosis Management
router.get('/diagnoses', adminAuth, controller.getDiagnoses);
router.delete('/diagnoses/:id', adminAuth, controller.deleteDiagnosis);

// System Health, Ingestion Trigger & Audit Logs
router.get('/system/health', adminAuth, controller.getSystemHealth);
router.post('/ingestion/trigger', adminAuth, controller.triggerIngestion);
router.get('/audit-logs', adminAuth, controller.getAuditLogs);

module.exports = router;
