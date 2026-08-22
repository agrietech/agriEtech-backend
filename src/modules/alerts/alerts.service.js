const { prisma, isConnected } = require('../../config/db');
const { dispatchHazardAlertSms } = require('../../delivery/sms/smsDispatcher');
const { broadcastEmergencyAlert } = require('../../delivery/websocket/riskAssessmentChannel');
const { sendPushNotification } = require('../../delivery/push/fcmDispatcher');
const logger = require('../../utils/logger');

const inMemoryAlerts = new Map();

// Create emergency early warning alert
async function createAlert({
  woredaId,
  woredaName,
  hazardType,
  severity,
  headline,
  titleEn,
  titleAm,
  titleOm,
  messageEn,
  messageAm,
  messageOm,
  targetPhones = [],
}) {
  const resolvedTitleEn = titleEn || headline || '';
  const resolvedMessageEn = messageEn || '';

  if (!woredaId || !hazardType || !resolvedTitleEn) {
    throw Object.assign(new Error('woredaId, hazardType, and a title are required'), { statusCode: 400 });
  }

  let alert = null;

  if (isConnected()) {
    try {
      alert = await prisma.alert.create({
        data: {
          woredaId,
          hazardType,
          severity: severity || 'HIGH',
          headline: headline || resolvedTitleEn,
          status: 'ACTIVE',
          titleEn: resolvedTitleEn,
          titleAm: titleAm || '',
          titleOm: titleOm || null,
          messageEn: resolvedMessageEn,
          messageAm: messageAm || '',
          messageOm: messageOm || null,
        },
      });
    } catch (_err) {
      // Fallback
    }
  }

  if (!alert) {
    alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      woredaId,
      hazardType,
      severity: severity || 'HIGH',
      headline: headline || resolvedTitleEn,
      status: 'ACTIVE',
      titleEn: resolvedTitleEn,
      titleAm: titleAm || '',
      titleOm: titleOm || null,
      messageEn: resolvedMessageEn,
      messageAm: messageAm || '',
      messageOm: messageOm || null,
      createdAt: new Date().toISOString(),
      woreda: { id: woredaId, nameEn: woredaName || 'Adama Zuria', nameAm: 'አዳማ ዙሪያ' },
    };
    inMemoryAlerts.set(alert.id, alert);
  }

  // 1. Dispatch Push Notifications via Firebase Cloud Messaging
  try {
    const pushTitle = alert.titleAm || alert.titleEn || alert.headline;
    const pushBody = alert.messageAm || alert.messageEn || 'New agricultural advisory alert.';
    await sendPushNotification({
      topic: `woreda_${woredaId}`,
      title: `⚠️ ${pushTitle}`,
      body: pushBody,
      data: {
        alertId: alert.id,
        hazardType: alert.hazardType,
        severity: alert.severity,
        woredaId: alert.woredaId,
      },
    });
  } catch (pushErr) {
    logger.warn(`[Alerts] Push notification dispatch failed (non-fatal): ${pushErr.message}`);
  }

  // 2. Dispatch SMS alerts to targeted phone numbers
  if (targetPhones.length > 0) {
    try {
      await dispatchHazardAlertSms({
        phoneNumbers: targetPhones,
        hazardType: hazardType || 'DROUGHT',
        woredaName: woredaName || 'Unknown',
        severity: severity || 'HIGH',
      });
    } catch (smsErr) {
      logger.warn(`[Alerts] SMS dispatch failed (non-fatal): ${smsErr.message}`);
    }
  }

  // 3. Broadcast via WebSocket
  try {
    broadcastEmergencyAlert(alert);
  } catch (wsErr) {
    logger.warn(`[Alerts] WebSocket broadcast failed (non-fatal): ${wsErr.message}`);
  }

  return alert;
}

// Get active alerts with optional filters
async function getActiveAlerts({ severity, woredaId, hazardType, status } = {}) {
  if (isConnected()) {
    try {
      const where = {};
      if (status) {
        where.status = status;
      } else {
        where.status = 'ACTIVE';
      }
      if (severity) where.severity = severity;
      if (woredaId) where.woredaId = woredaId;
      if (hazardType) where.hazardType = hazardType;

      return await prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          woreda: { select: { id: true, nameEn: true, nameAm: true } },
        },
      });
    } catch (_err) {
      // Fallback
    }
  }

  const list = Array.from(inMemoryAlerts.values());
  return list;
}

async function getAlertById(id) {
  if (isConnected()) {
    try {
      const alert = await prisma.alert.findUnique({
        where: { id },
        include: {
          woreda: { select: { id: true, nameEn: true, nameAm: true } },
        },
      });
      if (alert) return alert;
    } catch (_err) {
      // Fallback
    }
  }

  return inMemoryAlerts.get(id) || null;
}

module.exports = {
  createAlert,
  getActiveAlerts,
  getAlertById,
  inMemoryAlerts,
};
