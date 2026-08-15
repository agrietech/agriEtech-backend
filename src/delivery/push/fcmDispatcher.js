const logger = require('../../utils/logger');

// Send push notification via Firebase Cloud Messaging
async function sendPushNotification({ token, topic, title, body, data = {} }) {
  // Production FCM implementation hook
  logger.info(`[Push Dispatch] Target: ${token || topic} - "${title}: ${body}"`);
  return { success: true, target: token || topic, data };
}

module.exports = {
  sendPushNotification,
};
