const { prisma, isConnected } = require('../../config/db');
const { dispatchHazardAlertSms } = require('../../delivery/sms/smsDispatcher');
const {
  broadcastAlertToWoreda,
  broadcastEmergencyAlert,
} = require('../../delivery/websocket/riskAssessmentChannel');

// Create emergency early warning alert
async function createAlert({
  woredaId,
  woredaName,
  hazardType,
  severity,
  headline,
  message,
  targetPhones = [],
}) {
  let alert = null;

  if (isConnected()) {
    alert = await prisma.alert.create({
      data: {
        woredaId,
        hazardType,
        severity: severity || 'HIGH',
        headline,
        message,
        status: 'ACTIVE',
      },
    });
  } else {
    alert = {
      id: `alert_${Date.now()}`,
      woredaId,
      hazardType,
      severity,
      headline,
      message,
      status: 'ACTIVE',
    };
  }

  if (targetPhones.length > 0) {
    await dispatchHazardAlertSms({
      phoneNumbers: targetPhones,
      hazardType: hazardType || 'DROUGHT',
      woredaName: woredaName || 'Adama',
      severity: severity || 'HIGH',
    });
  }

  broadcastAlertToWoreda(woredaId, alert);
  if ((severity || 'HIGH').toUpperCase() === 'CRITICAL') {
    broadcastEmergencyAlert(alert);
  }
  return alert;
}

// Get active alerts
async function getActiveAlerts() {
  if (isConnected()) {
    return await prisma.alert.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  return [
    {
      id: 'alert_01',
      woredaId: 'woreda_adama_01',
      hazardType: 'DROUGHT',
      severity: 'WARNING',
      headline: 'Rainfall Deficit Warning',
    },
  ];
}

module.exports = {
  createAlert,
  getActiveAlerts,
};
