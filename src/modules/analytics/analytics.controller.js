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

module.exports = {
  getDashboardSummary,
  getRegionalBreakdown,
  getTemporalTrends,
  getAgronomicAdvisories,
  getAiInsights,
};
