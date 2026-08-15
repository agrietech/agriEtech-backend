const analyticsService = require('./analytics.service');

async function getSummary(_req, res, next) {
  try {
    const data = await analyticsService.getDashboardSummary();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getRegionalAnalytics(_req, res, next) {
  try {
    const data = await analyticsService.getRegionalBreakdown();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
  getRegionalAnalytics,
};
