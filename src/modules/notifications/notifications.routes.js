const express = require('express');
const router = express.Router();
const controller = require('./notifications.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// All notification routes require authentication
router.use(authenticate);

router.get('/', controller.getMyNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/:id/read', controller.markAsRead);
router.post('/mark-all-read', controller.markAllAsRead);
router.delete('/:id', controller.deleteNotification);

module.exports = router;
