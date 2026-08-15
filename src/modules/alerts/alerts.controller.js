const alertsService = require('./alerts.service');

async function createAlert(req, res, next) {
  try {
    const { woredaId, woredaName, hazardType, severity, headline, message, targetPhones } =
      req.body;
    if (!woredaId || !hazardType || !headline) {
      return res
        .status(400)
        .json({ success: false, error: 'woredaId, hazardType, and headline are required' });
    }
    const alert = await alertsService.createAlert({
      woredaId,
      woredaName,
      hazardType,
      severity,
      headline,
      message,
      targetPhones,
    });
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
}

async function getAlerts(_req, res, next) {
  try {
    const data = await alertsService.getActiveAlerts();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAlert,
  getAlerts,
};
