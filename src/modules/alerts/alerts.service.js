const { prisma, isConnected } = require('../../config/db');
const { dispatchHazardAlertSms } = require('../../delivery/sms/smsDispatcher');
const { broadcastEmergencyAlert } = require('../../delivery/websocket/riskAssessmentChannel');
const logger = require('../../utils/logger');

const mockAlerts = new Map([
  [
    'alert_demo_01',
    {
      id: 'alert_demo_01',
      woredaId: 'woreda_adama_01',
      hazardType: 'DROUGHT',
      severity: 'WARNING',
      headline: 'Early Seasonal Moisture Deficit Warning',
      status: 'ACTIVE',
      titleEn: 'Early Seasonal Moisture Deficit Warning',
      titleAm: 'የአፈር እርጥበት እጥረት ማስጠንቀቂያ',
      titleOm: 'Akeekkachiisa Hanqina Jiidha Biyyee',
      messageEn: 'Rainfall is 35% below 10-year historical mean. Conserve soil moisture.',
      messageAm: 'የዝናብ መጠኑ ካለፉት 10 ዓመታት አማካይ በ35% ዝቅ ብሏል። የአፈር እርጥበትን ይቆጥቡ።',
      messageOm: 'Roobni %35 gadi bu\'eera. Jiidha biyyee qusadhaa.',
      createdAt: new Date().toISOString(),
      woreda: { id: 'woreda_adama_01', nameEn: 'Adama Zuria', nameAm: 'አዳማ ዙሪያ' },
    },
  ],
]);

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
    mockAlerts.set(alert.id, alert);
  }

  // Dispatch SMS alerts to targeted phone numbers
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

  // Broadcast via WebSocket
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

  const list = Array.from(mockAlerts.values());
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

  return mockAlerts.get(id) || mockAlerts.get('alert_demo_01');
}

module.exports = {
  createAlert,
  getActiveAlerts,
  getAlertById,
  mockAlerts,
};
