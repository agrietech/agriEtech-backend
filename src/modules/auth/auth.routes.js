const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Public authentication routes
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh-token', controller.refreshToken);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.post('/verify-email', controller.verifyEmail);
router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', controller.resendVerification);

// Protected routes (require valid JWT bearer token)
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getProfile);
router.patch('/update-password', authenticate, controller.updatePassword);

module.exports = router;
