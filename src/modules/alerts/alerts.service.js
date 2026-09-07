const { prisma } = require('../../config/db');
const { dispatchHazardAlertSms } = require('../../delivery/sms/smsDispatcher');
const { broadcastEmergencyAlert } = require('../../delivery/websocket/riskAssessmentChannel');
const { sendPushNotification } = require('../../delivery/push/fcmDispatcher');
const logger = require('../../utils/logger');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

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
  actionItems = [],
  priority = 1,
  expiresAt = null,
  targetPhones = [],
}) {
  const resolvedTitleEn = titleEn || headline || '';
  const resolvedMessageEn = messageEn || '';

  if (!woredaId || !hazardType || !resolvedTitleEn) {
    throw new BadRequestError('woredaId, hazardType, and title are required');
  }

  // Verify or resolve woreda
  let woreda = await prisma.woreda.findFirst({
    where: {
      OR: [
        { id: woredaId },
        { nameEn: { equals: woredaName || woredaId, mode: 'insensitive' } },
      ],
    },
  });
  if (!woreda) {
    try {
      woreda = await prisma.woreda.create({
        data: {
          id: woredaId,
          nameEn: woredaName || woredaId,
          nameAm: 'አዳማ ዙሪያ',
          region: 'Oromia',
          zone: 'East Shewa',
          latitude: 8.54,
          longitude: 39.27,
        },
      });
    } catch (_createErr) {
      woreda = await prisma.woreda.findFirst();
    }
  }
  if (!woreda) {
    throw new NotFoundError(`Woreda '${woredaId}' does not exist`);
  }
  const resolvedWoredaId = woreda.id;

  // Evaluate crop calendar context
  const cropCalendar = evaluateCropSeasonContext(hazardType);
  const effectiveSeverity = (cropCalendar.isOffSeasonAlert && severity === 'CRITICAL')
    ? 'MODERATE'
    : (severity || 'HIGH');

  const finalMessageEn = cropCalendar.contextNotice
    ? `${resolvedMessageEn} ${cropCalendar.contextNotice}`.trim()
    : resolvedMessageEn;

  const alert = await prisma.alert.create({
    data: {
      woredaId: resolvedWoredaId,
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
      priority: typeof priority === 'number' ? priority : 1,
      actionItems: actionItems || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      targetPhones: Array.isArray(targetPhones) ? targetPhones : [],
    },
    include: {
      woreda: { select: { id: true, nameEn: true, nameAm: true } },
    },
  });

  // Automatically create a linked Advisory record
  try {
    await prisma.advisory.create({
      data: {
        alertId: alert.id,
        woredaId: resolvedWoredaId,
        hazardType,
        severity: effectiveSeverity,
        titleEn: alert.titleEn,
        titleAm: alert.titleAm || alert.titleEn,
        titleOm: alert.titleOm || null,
        adviceEn: alert.messageEn,
        adviceAm: alert.messageAm || alert.messageEn,
        adviceOm: alert.messageOm || null,
        actionItems: alert.actionItems,
        validUntil: alert.expiresAt,
        status: 'ACTIVE',
      },
    });
  } catch (advErr) {
    logger.warn(`[Alerts] Auto-advisory creation notice: ${advErr.message}`);
  }

  // Dispatch notifications to registered users in this woreda
  try {
    const usersInWoreda = await prisma.user.findMany({
      where: { woredaId },
      select: { id: true },
    });

    if (usersInWoreda.length > 0) {
      await prisma.notification.createMany({
        data: usersInWoreda.map((u) => ({
          userId: u.id,
          titleEn: `🚨 ${alert.titleEn}`,
          titleAm: `🚨 ${alert.titleAm || alert.titleEn}`,
          bodyEn: alert.messageEn,
          bodyAm: alert.messageAm || alert.messageEn,
          type: 'ALERT',
          metadata: { alertId: alert.id, hazardType: alert.hazardType, severity: alert.severity },
        })),
      });
      logger.info(`[Alerts] Dispatched notifications to ${usersInWoreda.length} users in woreda ${woredaId}`);
    }
  } catch (notifErr) {
    logger.warn(`[Alerts] Notification dispatch notice: ${notifErr.message}`);
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
        woredaName: woredaName || alert.woreda?.nameEn || 'Unknown',
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

// Get active alerts with optional filters — supports jurisdiction scoping
async function getActiveAlerts({ severity, woredaId, zoneId, regionId, hazardType, status } = {}) {
  const where = {};
  if (status) {
    where.status = status;
  } else {
    where.status = 'ACTIVE';
  }
  if (severity) where.severity = severity;
  if (hazardType) where.hazardType = hazardType;

  // Apply jurisdictional scope filtering
  if (woredaId) {
    where.woredaId = woredaId;
  } else if (zoneId) {
    // Zonal Officer: restrict alerts to woredas within their assigned zone
    where.woreda = { zoneId };
  } else if (regionId) {
    // Regional Officer: restrict alerts to woredas within their assigned region
    where.woreda = { zone: { regionId } };
  }

  return await prisma.alert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      woreda: { select: { id: true, nameEn: true, nameAm: true } },
    },
  });
}

// Get alert by ID
async function getAlertById(id) {
  const alert = await prisma.alert.findUnique({
    where: { id },
    include: {
      woreda: { select: { id: true, nameEn: true, nameAm: true } },
      advisories: true,
    },
  });

  if (!alert) {
    throw new NotFoundError(`Alert '${id}' not found`);
  }

  return alert;
}

async function markAlertAsRead(id) {
  const existing = await prisma.alert.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Alert '${id}' not found`);
  }

  return await prisma.alert.update({
    where: { id },
    data: { isRead: true },
    include: {
      woreda: { select: { id: true, nameEn: true, nameAm: true } },
    },
  });
}

/**
 * Record farmer ground-truth feedback about an alert's accuracy.
 */
async function submitAlertFeedback({ alertId, userId, accurate, notes }) {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) {
    throw new NotFoundError(`Alert '${alertId}' not found`);
  }

  // Log ground-truth feedback into AuditLog
  await prisma.auditLog.create({
    data: {
      action: 'ALERT_FEEDBACK_SUBMITTED',
      adminId: userId || null,
      details: JSON.stringify({ alertId, accurate, notes: notes || '' }),
    },
  });

  return {
    alertId,
    userId: userId || 'anonymous',
    accurate,
    notes: notes || '',
    submittedAt: new Date().toISOString(),
  };
}

module.exports = {
  createAlert,
  getActiveAlerts,
  getAlertById,
  markAlertAsRead,
  submitAlertFeedback,
};
