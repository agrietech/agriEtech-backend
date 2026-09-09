const { prisma } = require('../../config/db');
const { NotFoundError } = require('../../utils/errors');
const logger = require('../../utils/logger');

/**
 * Notifications Service
 * Delivers alerts, advisories, and system warnings to user accounts.
 */

async function getUserNotifications(userId, { unreadOnly = false, limit = 50, offset = 0 } = {}) {
  if (!userId) {
    return { notifications: [], total: 0, unreadCount: 0, limit: 50, offset: 0 };
  }

  try {
    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10) || 50,
        skip: parseInt(offset, 10) || 0,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    };
  } catch (err) {
    logger.warn(`[NotificationService] getUserNotifications fallback: ${err.message}`);
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    };
  }
}

async function getUnreadCount(userId) {
  if (!userId) return { unreadCount: 0 };
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  } catch (err) {
    logger.warn(`[NotificationService] getUnreadCount fallback: ${err.message}`);
    return { unreadCount: 0 };
  }
}

async function markAsRead(id, userId) {
  const notif = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notif) {
    throw new NotFoundError('Notification not found');
  }

  return await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { message: 'All notifications marked as read' };
}

async function deleteNotification(id, userId) {
  const notif = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notif) {
    throw new NotFoundError('Notification not found');
  }

  await prisma.notification.delete({ where: { id } });
  return { message: 'Notification deleted successfully' };
}

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
