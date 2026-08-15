const { prisma, isConnected } = require('../../config/db');
const { calculateCompositeRisk } = require('../../processing/riskAggregator');
const { broadcastRiskUpdate } = require('../../delivery/websocket/riskAssessmentChannel');

// Compute multi-hazard risk and persist assessment
async function evaluateWoredaRisk(woredaId, hazardScores = {}) {
  const result = calculateCompositeRisk(hazardScores);

  let record = null;
  if (isConnected()) {
    record = await prisma.riskAssessment.create({
      data: {
        woredaId,
        droughtScore: hazardScores.drought || 0,
        floodScore: hazardScores.flood || 0,
        locustScore: hazardScores.locust || 0,
        vegetationScore: hazardScores.vegetation || 0,
        compositeScore: result.compositeScore,
        alertLevel: result.alertLevel,
        assessedAt: new Date(),
      },
    });
  } else {
    record = {
      id: `risk_${Date.now()}`,
      woredaId,
      ...hazardScores,
      ...result,
      assessedAt: new Date().toISOString(),
    };
  }

  broadcastRiskUpdate(woredaId, record);
  return record;
}

// Get recent risk assessments
async function getLatestAssessments() {
  if (isConnected()) {
    return await prisma.riskAssessment.findMany({ orderBy: { assessedAt: 'desc' }, take: 20 });
  }

  return [
    {
      id: 'risk_01',
      woredaId: 'woreda_adama_01',
      compositeScore: 0.38,
      alertLevel: 'YELLOW',
      primaryThreat: 'DROUGHT',
    },
  ];
}

module.exports = {
  evaluateWoredaRisk,
  getLatestAssessments,
};
