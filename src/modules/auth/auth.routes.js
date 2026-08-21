const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authLimiter, userAuthLimiter } = require('../../middleware/rateLimiter');

// Role request routes
const roleRequestRoutes = require('../roleRequest/roleRequest.routes');

// Public authentication routes
router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, userAuthLimiter, controller.login);
router.post('/refresh-token', authLimiter, controller.refreshToken);
router.post('/forgot-password', authLimiter, controller.forgotPassword);
router.post('/reset-password', authLimiter, controller.resetPassword);
router.post('/verify-email', controller.verifyEmail);
router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', authLimiter, controller.resendVerification);

// Protected routes (require valid JWT bearer token)
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getProfile);
router.patch('/update-password', authenticate, controller.updatePassword);

// Role upgrade application routes
router.use('/role-requests', roleRequestRoutes);

module.exports = router;
