const env = require('../../config/env');
const logger = require('../../utils/logger');

let messaging = null;

try {
  if (env.NODE_ENV === 'production') {
    const admin = require('firebase-admin');
    const serviceAccount = require(env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    messaging = admin.messaging();
  }
} catch (err) {
  logger.warn(`Firebase Admin init skipped: ${err.message}`);
}

// Send push notification via Firebase Cloud Messaging.
// Accepts either a single device `token` or a `topic` (mutually exclusive).
async function sendPushNotification({ token, topic, title, body, data = {} }) {
  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    ...(token ? { token } : { topic }),
  };

  if (messaging) {
    try {
      const messageId = await messaging.send(message);
      return { success: true, target: token || topic, messageId };
    } catch (err) {
      logger.warn(`FCM dispatch failed: ${err.message}`);
      return { success: false, target: token || topic, error: err.message };
    }
  }

  // Development sandbox fallback — no Firebase credentials configured.
  logger.info(`[Push Dispatch] Target: ${token || topic} - "${title}: ${body}"`);
  return { success: true, target: token || topic, data, simulated: true };
}

// Send the same push to a batch of device tokens (e.g. all farmers in a woreda).
async function sendPushToTokens(tokens, { title, body, data = {} }) {
  const results = await Promise.all(
    tokens.map((token) => sendPushNotification({ token, title, body, data }))
  );
  return { successCount: results.filter((r) => r.success).length, results };
}

module.exports = {
  sendPushNotification,
  sendPushToTokens,
};
