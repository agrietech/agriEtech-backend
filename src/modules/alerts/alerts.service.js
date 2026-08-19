const { prisma, isConnected } = require('../../config/db');
const { dispatchHazardAlertSms } = require('../../delivery/sms/smsDispatcher');
const { broadcastEmergencyAlert } = require('../../delivery/websocket/riskAssessmentChannel');

// In-memory store for dev/test
const _mockAlerts = [];

// Create emergency early warning alert
async function createAlert({
  woredaId,
  woredaName,
  hazardType,
  severity,
  headline,
  message,
  titleEn,
  titleAm,
  titleOm,
  messageEn,
  messageAm,
  messageOm,
  targetPhones = [],
}) {
  let alert = null;

  if (isConnected()) {
    alert = await prisma.alert.create({
      data: {
        woredaId,
        hazardType,
        severity: severity || 'HIGH',
        headline: headline || titleEn || '',
        message: message || messageEn || '',
        titleEn: titleEn || headline || '',
        titleAm: titleAm || '',
        titleOm: titleOm || '',
        messageEn: messageEn || message || '',
        messageAm: messageAm || '',
        messageOm: messageOm || '',
        status: 'ACTIVE',
      },
    });
  } else {
    alert = {
      id: `alert_${Date.now()}`,
      woredaId,
      hazardType,
      severity: severity || 'HIGH',
      headline: headline || titleEn || '',
      message: message || messageEn || '',
      titleEn: titleEn || headline || '',
      titleAm: titleAm || '',
      titleOm: titleOm || '',
      messageEn: messageEn || message || '',
      messageAm: messageAm || '',
      messageOm: messageOm || '',
      status: 'ACTIVE',
      title: titleEn || headline || '',
      sentAt: new Date().toISOString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    _mockAlerts.unshift(alert);
  }

  if (targetPhones.length > 0) {
    try {
      await dispatchHazardAlertSms({
        phoneNumbers: targetPhones,
        hazardType: hazardType || 'DROUGHT',
        woredaName: woredaName || 'Adama',
        severity: severity || 'HIGH',
      });
    } catch (_e) {
      // Non-fatal
    }
  }

  try {
    broadcastEmergencyAlert(alert);
  } catch (_e) {
    // Non-fatal when WebSocket not connected in tests
  }
  return alert;
}

// Get active alerts with optional filters
async function getActiveAlerts({ severity, woredaId, hazardType, status } = {}) {
  if (isConnected()) {
    const where = { status: status || 'ACTIVE' };
    if (severity) where.severity = severity;
    if (woredaId) where.woredaId = woredaId;
    if (hazardType) where.hazardType = hazardType;
    return await prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  let results =
    _mockAlerts.length > 0
      ? [..._mockAlerts]
      : [
          {
            id: 'alert_01',
            woredaId: 'woreda_adama_01',
            hazardType: 'DROUGHT',
            severity: 'WARNING',
            headline: 'Rainfall Deficit Warning',
            titleEn: 'Rainfall Deficit Warning',
            title: 'Rainfall Deficit Warning',
            message: 'Below normal rainfall detected.',
            messageEn: 'Below normal rainfall detected.',
            status: 'ACTIVE',
            sentAt: new Date().toISOString(),
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ];

  if (severity) results = results.filter((a) => a.severity === severity);
  if (woredaId) results = results.filter((a) => a.woredaId === woredaId);
  if (hazardType) results = results.filter((a) => a.hazardType === hazardType);
  return results;
}

async function getAlertById(id) {
  if (isConnected()) {
    return await prisma.alert.findUnique({ where: { id } });
  }
  return (
    _mockAlerts.find((a) => a.id === id) || {
      id,
      hazardType: 'DROUGHT',
      severity: 'HIGH',
      title: 'Demo Alert',
      titleEn: 'Demo Alert',
      message: 'Demo message',
      messageEn: 'Demo message',
      status: 'ACTIVE',
      sentAt: new Date().toISOString(),
      isRead: false,
    }
  );
}

async function markAlertAsRead(id) {
  if (isConnected()) {
    return await prisma.alert.update({ where: { id }, data: { isRead: true } });
  }
  const alert = _mockAlerts.find((a) => a.id === id);
  if (alert) alert.isRead = true;
  return alert || { id, isRead: true };
}

module.exports = {
  createAlert,
  getActiveAlerts,
  getAlertById,
  markAlertAsRead,
};
