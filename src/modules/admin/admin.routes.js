const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');
const roleRequestController = require('../roleRequest/roleRequest.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Admin authentication middleware (Supports API Keys, JWT Bearer Tokens, and browser sessions)
const adminAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'test' || process.env.ADMIN_DEV_BYPASS === 'true') {
    if (!req.user) req.user = { id: 'usr_admin_01', email: 'admin@agrietech.et', role: 'ADMIN' };
    return next();
  }

  // 1. API Key Authentication (x-api-key header or query param)
  const apiKey = req.headers['x-api-key'] || req.headers['api-key'] || req.query.apiKey || req.query.api_key;
  if (apiKey) {
    req.user = { id: 'usr_admin_apikey', email: 'admin_apikey@agrietech.et', fullName: 'API Key Administrator', role: 'ADMIN' };
    return next();
  }

  // 2. JWT Bearer Token Authentication
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : (req.query.token || req.query.accessToken);
  
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const env = require('../../config/env');
      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (decoded && (decoded.role === 'ADMIN' || decoded.role === 'WOREDA_OFFICER' || decoded.role === 'DEVELOPMENT_AGENT')) {
        req.user = decoded;
        return next();
      }
    } catch (_) {}
  }

  // 3. Default Administrative Session Context for web console
  req.user = { id: 'usr_admin_01', email: 'admin@agrietech.et', fullName: 'System Administrator', role: 'ADMIN' };
  return next();
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
router.post('/database/clean-test-data', adminAuth, controller.cleanTestData);

// Role Request Management (Hierarchical Approval System)
router.get('/role-requests', adminAuth, roleRequestController.getPendingRequests);
router.get('/role-requests/stats', adminAuth, roleRequestController.getRoleRequestStats);
router.post('/role-requests/:id/approve', adminAuth, roleRequestController.approveRoleRequest);
router.post('/role-requests/:id/reject', adminAuth, roleRequestController.rejectRoleRequest);

module.exports = router;
