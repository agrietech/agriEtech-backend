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
    const user = req.user;
    const userRole = (user?.role || '').toUpperCase();

    // ── RBAC: Auto-scope alert queries by the user's jurisdiction ──
    let scopedWoredaId = woredaId || null;
    let scopedZoneId = null;
    let scopedRegionId = null;

    if (userRole === 'FARMER' || userRole === 'DEVELOPMENT_AGENT' || userRole === 'WOREDA_OFFICER') {
      // These roles only see alerts within their assigned woreda
      scopedWoredaId = scopedWoredaId || user?.woredaId || null;
    } else if (userRole === 'ZONAL_OFFICER') {
      // Zonal Officers see all alerts within their zone
      scopedZoneId = user?.zoneId || null;
    } else if (userRole === 'REGIONAL_OFFICER') {
      // Regional Officers see all alerts within their region
      scopedRegionId = user?.regionId || null;
    }
    // ADMIN and RESEARCHER see all alerts (no scope filter)

    const data = await alertsService.getActiveAlerts({
      severity,
      woredaId: scopedWoredaId,
      zoneId: scopedZoneId,
      regionId: scopedRegionId,
      hazardType,
      status,
    });
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

/**
 * POST /alerts/:id/feedback
 * Accepts ground-truth feedback from farmers/agents about alert accuracy.
 * Body: { accurate: boolean, notes?: string }
 */
async function submitFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const { accurate, notes } = req.body;

    if (typeof accurate !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: { message: "'accurate' field is required and must be a boolean", code: 'VALIDATION_ERROR' },
      });
    }

    const feedback = await alertsService.submitAlertFeedback({
      alertId: id,
      userId: req.user?.id,
      accurate,
      notes: (notes || '').toString().substring(0, 500),
    });

    return res.status(201).json({
      success: true,
      data: feedback,
      message: 'Thank you for your feedback. It helps us improve alert accuracy.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAlert,
  getAlerts,
  getAlertById,
  markAlertAsRead,
  submitFeedback,
};

