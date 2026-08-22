const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');
const env = require('../../config/env');

let fcmInitialized = false;

function initFirebaseAdmin() {
  if (fcmInitialized) return admin;

  try {
    const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../../config/firebase-service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: env.FIREBASE_DATABASE_URL,
        projectId: env.FIREBASE_PROJECT_ID || 'arduinomoisture',
      });
      fcmInitialized = true;
      logger.info('[FCM Dispatcher] Firebase Admin initialized with service account.');
    } else if (env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: env.FIREBASE_PROJECT_ID,
      });
      fcmInitialized = true;
      logger.info(`[FCM Dispatcher] Firebase Admin initialized with project ID: ${env.FIREBASE_PROJECT_ID}`);
    }
  } catch (err) {
    logger.warn(`[FCM Dispatcher] Firebase Admin initialization note: ${err.message}`);
  }

  return admin;
}

// Send push notification via Firebase Cloud Messaging
async function sendPushNotification({ token, topic, title, body, data = {} }) {
  try {
    initFirebaseAdmin();

    const message = {
      notification: {
        title: title || 'AgriEtech Alert',
        body: body || 'New agricultural advisory alert available.',
      },
      data: Object.fromEntries(
        Object.entries(data || {}).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
      ),
    };

    if (token) {
      message.token = token;
    } else if (topic) {
      message.topic = topic.replace(/^\/topics\//, '');
    } else {
      message.topic = 'all_farmers';
    }

    if (fcmInitialized && admin.messaging) {
      const response = await admin.messaging().send(message);
      logger.info(`[FCM Dispatcher] Push notification sent successfully to ${token || topic}: ${response}`);
      return { success: true, messageId: response, target: token || topic };
    } else {
      logger.info(`[FCM Dispatcher] (Simulated Delivery) Target: ${token || topic} - "${title}: ${body}"`);
      return { success: true, simulated: true, target: token || topic, data };
    }
  } catch (error) {
    logger.error(`[FCM Dispatcher] Push send error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Send multicast notification to multiple devices
async function sendMulticastNotification({ tokens = [], title, body, data = {} }) {
  if (!tokens || tokens.length === 0) return { success: false, count: 0 };

  try {
    initFirebaseAdmin();

    const message = {
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data || {}).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
      ),
      tokens,
    };

    if (fcmInitialized && admin.messaging) {
      const response = await admin.messaging().sendEachForMulticast(message);
      logger.info(`[FCM Dispatcher] Multicast sent. Success: ${response.successCount}, Failures: ${response.failureCount}`);
      return { success: true, successCount: response.successCount, failureCount: response.failureCount };
    } else {
      logger.info(`[FCM Dispatcher] (Simulated Multicast) to ${tokens.length} devices: "${title}: ${body}"`);
      return { success: true, simulated: true, count: tokens.length };
    }
  } catch (error) {
    logger.error(`[FCM Dispatcher] Multicast error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendMulticastNotification,
  initFirebaseAdmin,
};
