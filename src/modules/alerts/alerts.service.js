const { prisma, isConnected } = require('../../config/db');
const { dispatchHazardAlertSms } = require('../../delivery/sms/smsDispatcher');
const { broadcastEmergencyAlert } = require('../../delivery/websocket/riskAssessmentChannel');
const { sendPushNotification } = require('../../delivery/push/fcmDispatcher');
const logger = require('../../utils/logger');

const inMemoryAlerts = new Map();

// Ethiopian crop season calendar evaluator
function evaluateCropSeasonContext(hazardType, date = new Date()) {
  const month = date.getMonth() + 1; // 1 = Jan
  let season = 'DRY';
  let seasonName = 'Bega (Dry / Harvest Season)';
  let isPeakGrowingSeason = false;

  if (month >= 6 && month <= 9) {
    season = 'KIREMT';
    seasonName = 'Kiremt (Main Rainy Season / Meher Crops)';
    isPeakGrowingSeason = true;
  } else if (month >= 3 && month <= 5) {
    season = 'BELG';
    seasonName = 'Belg (Short Rainy Season)';
    isPeakGrowingSeason = true;
  }

  const isDroughtHazard = String(hazardType).toUpperCase().includes('DROUGHT');

  // In dry season (Bega), rain absence is normal — advise on livestock/irrigation rather than rainfed crop loss
  const isOffSeasonDrought = isDroughtHazard && season === 'DRY';

  return {
    season,
    seasonName,
    isPeakGrowingSeason,
    isOffSeasonAlert: isOffSeasonDrought,
    contextNotice: isOffSeasonDrought
      ? '[Seasonal Context: Bega dry season — Prioritize livestock water points & dry-season irrigation]'
      : (isPeakGrowingSeason ? '[Active Growing Season — Immediate field protective action recommended]' : null),
  };
}

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

  // Evaluate crop calendar context
  const cropCalendar = evaluateCropSeasonContext(hazardType);
  const effectiveSeverity = (cropCalendar.isOffSeasonAlert && severity === 'CRITICAL')
    ? 'MODERATE' // Downgrade off-season false-alarm panics
    : (severity || 'HIGH');

  const finalMessageEn = cropCalendar.contextNotice
    ? `${resolvedMessageEn} ${cropCalendar.contextNotice}`.trim()
    : resolvedMessageEn;

  let alert = null;

  if (isConnected()) {
    try {
      alert = await prisma.alert.create({
        data: {
          woredaId,
          hazardType,
          severity: effectiveSeverity,
          headline: headline || resolvedTitleEn,
          status: 'ACTIVE',
          titleEn: resolvedTitleEn,
          titleAm: titleAm || '',
          titleOm: titleOm || null,
          messageEn: finalMessageEn,
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
      severity: effectiveSeverity,
      headline: headline || resolvedTitleEn,
      status: 'ACTIVE',
      titleEn: resolvedTitleEn,
      titleAm: titleAm || '',
      titleOm: titleOm || null,
      messageEn: finalMessageEn,
      messageAm: messageAm || '',
      messageOm: messageOm || null,
      cropCalendarContext: cropCalendar,
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


async function markAlertAsRead(id) {
  if (isConnected()) {
    try {
      const updated = await prisma.alert.update({
        where: { id },
        data: {
          isRead: true,
        },
        include: {
          woreda: { select: { id: true, nameEn: true, nameAm: true } },
        },
      });
      return updated;
    } catch (_err) {
      // Fallback
    }
  }

  const alert = inMemoryAlerts.get(id);
  if (alert) {
    alert.isRead = true;
    inMemoryAlerts.set(id, alert);
    return alert;
  }

  return { id, isRead: true };
}

// In-memory fallback for feedback storage during development / DB-offline mode
const inMemoryFeedback = new Map();

/**
 * Record farmer ground-truth feedback about an alert's accuracy.
 * { alertId, userId, accurate: boolean, notes: string }
 */
async function submitAlertFeedback({ alertId, userId, accurate, notes }) {
  const feedbackEntry = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    alertId,
    userId: userId || 'anonymous',
    accurate,
    notes: notes || '',
    submittedAt: new Date().toISOString(),
  };

  logger.info(`[AlertFeedback] userId=${feedbackEntry.userId} rated alert ${alertId} as ${accurate ? 'ACCURATE' : 'INACCURATE'}`);

  if (isConnected()) {
    try {
      // Uses AlertFeedback model if defined in Prisma schema; silently skips if not
      if (prisma.alertFeedback) {
        const saved = await prisma.alertFeedback.create({
          data: {
            alertId,
            userId: userId || null,
            accurate,
            notes: notes || '',
          },
        });
        return saved;
      }
    } catch (_err) {
      logger.warn(`[AlertFeedback] DB persist failed (non-fatal): ${_err.message}`);
    }
  }

  // Fallback: in-memory storage
  inMemoryFeedback.set(feedbackEntry.id, feedbackEntry);
  return feedbackEntry;
}


module.exports = {
  createAlert,
  getActiveAlerts,
  getAlertById,
  markAlertAsRead,
  submitAlertFeedback,
  inMemoryAlerts,
};
