const analyticsService = require('./analytics.service');

async function getDashboardSummary(_req, res, next) {
  try {
    const data = await analyticsService.getDashboardSummary();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getRegionalBreakdown(_req, res, next) {
  try {
    const data = await analyticsService.getRegionalBreakdown();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getTemporalTrends(req, res, next) {
  try {
    const { timeframe, woredaId, includeAi, language } = req.query;
    const data = await analyticsService.getTemporalTrends({
      timeframe,
      woredaId,
      includeAi,
      language,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAgronomicAdvisories(req, res, next) {
  try {
    const { cropType, season, woredaId } = req.query;
    const data = await analyticsService.getAgronomicAdvisories({
      cropType,
      season,
      woredaId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAiInsights(req, res, next) {
  try {
    const { woredaId, timeframe, language, metrics } = req.body;
    const data = await analyticsService.getAiInsights({
      woredaId,
      timeframe,
      language,
      metrics,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// Location-specific map and analytics
async function getLocationMap(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await analyticsService.getLocationMap(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getLocationAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await analyticsService.getLocationAnalytics(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getRegionMap(req, res, next) {
  try {
    const { regionId } = req.params;
    const data = await analyticsService.getRegionMap(regionId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getRegionAnalytics(req, res, next) {
  try {
    const { regionId } = req.params;
    const data = await analyticsService.getRegionAnalytics(regionId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getZoneMap(req, res, next) {
  try {
    const { zoneId } = req.params;
    const data = await analyticsService.getZoneMap(zoneId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getZoneAnalytics(req, res, next) {
  try {
    const { zoneId } = req.params;
    const data = await analyticsService.getZoneAnalytics(zoneId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getWoredaMap(req, res, next) {
  try {
    const { woredaId } = req.params;
    const data = await analyticsService.getWoredaMap(woredaId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getWoredaAnalytics(req, res, next) {
  try {
    const { woredaId } = req.params;
    const data = await analyticsService.getWoredaAnalytics(woredaId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardSummary,
  getRegionalBreakdown,
  getTemporalTrends,
  getAgronomicAdvisories,
  getAiInsights,
  getLocationMap,
  getLocationAnalytics,
  getRegionMap,
  getRegionAnalytics,
  getZoneMap,
  getZoneAnalytics,
  getWoredaMap,
  getWoredaAnalytics,
};
