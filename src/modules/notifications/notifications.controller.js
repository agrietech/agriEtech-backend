const notificationsService = require('./notifications.service');

/**
 * Notifications Controller
 */

async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { unreadOnly, limit, offset } = req.query;

    const result = await notificationsService.getUserNotifications(userId, {
      unreadOnly: unreadOnly === 'true' || unreadOnly === true,
      limit,
      offset,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await notificationsService.getUnreadCount(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await notificationsService.markAsRead(req.params.id, userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await notificationsService.markAllAsRead(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await notificationsService.deleteNotification(req.params.id, userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
