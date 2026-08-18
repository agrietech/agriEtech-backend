const riskService = require('./riskAssessments.service');

async function evaluateRisk(req, res, next) {
  try {
    const { woredaId, hazardScores, drought, flood, locust, vegetation } = req.body;
    if (!woredaId) return res.status(400).json({ success: false, error: 'woredaId is required' });

    const scores = hazardScores || {
      drought: parseFloat(drought) || 0,
      flood: parseFloat(flood) || 0,
      locust: parseFloat(locust) || 0,
      vegetation: parseFloat(vegetation) || 0,
    };

    const assessment = await riskService.evaluateWoredaRisk(woredaId, scores);
    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    next(error);
  }
}

async function getLatestAssessments(req, res, next) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const data = await riskService.getLatestAssessments(limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getWoredaAssessments(req, res, next) {
  try {
    const data = await riskService.getAssessmentsByWoreda(req.params.woredaId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getStatistics(req, res, next) {
  try {
    const data = await riskService.getRiskStatistics();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  evaluateRisk,
  getLatestAssessments,
  getWoredaAssessments,
  getStatistics,
};
