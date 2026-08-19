const alertsService = require('./alerts.service');

async function createAlert(req, res, next) {
  try {
    const {
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
      targetPhones,
    } = req.body;

    const resolvedHeadline = headline || titleEn || titleAm || titleOm;
    const resolvedMessage = message || messageEn || messageAm || messageOm;

    if (!woredaId || !hazardType || !resolvedHeadline) {
      return res.status(400).json({
        success: false,
        error: 'woredaId, hazardType, and a title/headline are required',
      });
    }

    const alert = await alertsService.createAlert({
      woredaId,
      woredaName,
      hazardType,
      severity,
      headline: resolvedHeadline,
      message: resolvedMessage,
      titleEn,
      titleAm,
      titleOm,
      messageEn,
      messageAm,
      messageOm,
      targetPhones: targetPhones || [],
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
}

async function getAlerts(req, res, next) {
  try {
    const { severity, woredaId, hazardType, status } = req.query;
    const data = await alertsService.getActiveAlerts({ severity, woredaId, hazardType, status });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAlertById(req, res, next) {
  try {
    const alert = await alertsService.getAlertById(req.params.id);
    return res.status(200).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
}

async function markAlertAsRead(req, res, next) {
  try {
    const alert = await alertsService.markAlertAsRead(req.params.id);
    return res.status(200).json({ success: true, data: alert, message: 'Alert marked as read.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAlert,
  getAlerts,
  getAlertById,
  markAlertAsRead,
};
