const riskService = require('./riskAssessments.service');

async function evaluateRisk(req, res, next) {
  try {
    const { woredaId, drought, flood, locust, vegetation } = req.body;
    if (!woredaId) return res.status(400).json({ success: false, error: 'woredaId is required' });

    const assessment = await riskService.evaluateWoredaRisk(woredaId, {
      drought: parseFloat(drought) || 0,
      flood: parseFloat(flood) || 0,
      locust: parseFloat(locust) || 0,
      vegetation: parseFloat(vegetation) || 0,
    });

    res.status(200).json({ success: true, data: assessment });
  } catch (error) {
    next(error);
  }
}

async function getLatestAssessments(_req, res, next) {
  try {
    const data = await riskService.getLatestAssessments();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  evaluateRisk,
  getLatestAssessments,
};
