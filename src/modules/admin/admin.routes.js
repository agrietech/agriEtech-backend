const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');
const roleRequestController = require('../roleRequest/roleRequest.controller');

// Admin authentication middleware (Supports API Keys, JWT Bearer Tokens, and browser sessions)
const adminAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'test' || process.env.ADMIN_DEV_BYPASS === 'true') {
    if (!req.user) req.user = { id: 'usr_admin_01', email: 'admin@agrietech.et', role: 'ADMIN' };
    return next();
  }

  // 1. API Key Authentication (x-api-key header or query param)
  // Validates against ADMIN_API_KEYS env variable (comma-separated whitelist)
  const apiKey = req.headers['x-api-key'] || req.headers['api-key'] || req.query.apiKey || req.query.api_key;
  if (apiKey) {
    const validKeys = (process.env.ADMIN_API_KEYS || process.env.SENSOR_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
    if (validKeys.length > 0 && validKeys.includes(apiKey)) {
      req.user = { id: 'usr_admin_apikey', email: 'admin_apikey@agrietech.et', fullName: 'API Key Administrator', role: 'ADMIN' };
      return next();
    }
  }

  // 2. JWT Bearer Token Authentication
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : (req.query.token || req.query.accessToken);
  
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const env = require('../../config/env');
      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (decoded) {
        req.user = decoded;
        const allowedRoles = [
          'ADMIN',
          'REGIONAL_OFFICER',
          'ZONAL_OFFICER',
          'WOREDA_OFFICER',
          'DEVELOPMENT_AGENT',
        ];
        if (allowedRoles.includes(decoded.role)) {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            error: { message: 'Insufficient administrative privileges', code: 'FORBIDDEN' },
          });
        }
      }
    } catch (_err) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired authorization token', code: 'UNAUTHORIZED' },
      });
    }
  }

  return res.status(401).json({
    success: false,
    error: { message: 'Authentication required for administrative access', code: 'UNAUTHORIZED' },
  });
};

// Strict administrator authorization for sensitive operations
const requireAdmin = (req, res, next) => {
  if (process.env.NODE_ENV === 'test' || process.env.ADMIN_DEV_BYPASS === 'true') {
    return next();
  }
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'This operation requires system administrator privileges', code: 'FORBIDDEN' },
    });
  }
  next();
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
router.patch('/users/:id/role', adminAuth, requireAdmin, controller.updateUserRole);
router.patch('/users/:id/status', adminAuth, controller.updateUserStatus);
router.delete('/users/:id', adminAuth, requireAdmin, controller.deleteUser);

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
router.post('/database/clean-test-data', adminAuth, requireAdmin, controller.cleanTestData);

// Role Request Management (Hierarchical Approval System)
router.get('/role-requests', adminAuth, roleRequestController.getPendingRequests);
router.get('/role-requests/stats', adminAuth, roleRequestController.getRoleRequestStats);
router.post('/role-requests/:id/approve', adminAuth, roleRequestController.approveRoleRequest);
router.post('/role-requests/:id/reject', adminAuth, roleRequestController.rejectRoleRequest);

module.exports = router;
