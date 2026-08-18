const { prisma, isConnected } = require('../../config/db');
const { calculateCompositeRisk } = require('../../processing/riskAggregator');
const { broadcastRiskUpdate } = require('../../delivery/websocket/riskAssessmentChannel');

// In-memory store for dev/test
const _mockAssessments = [];

function generateRecommendations(alertLevel, _primaryThreat) {
  if (alertLevel === 'CRITICAL' || alertLevel === 'RED' || alertLevel === 'HIGH') {
    return [
      'Activate woreda early warning response protocol immediately.',
      'Deploy emergency supplemental feed and water distribution.',
      'Alert regional disaster prevention bureau.',
    ];
  }
  if (alertLevel === 'WATCH' || alertLevel === 'YELLOW' || alertLevel === 'MODERATE') {
    return [
      'Monitor soil moisture trends closely.',
      'Advise farmers to employ water conservation and mulching.',
      'Prepare emergency vaccination and seed reserves.',
    ];
  }
  return [
    'Continue routine agro-meteorological monitoring.',
    'Follow standard seasonal crop calendar.',
  ];
}

// Compute multi-hazard risk and persist assessment
async function evaluateWoredaRisk(woredaId, hazardScores = {}) {
  const normalizedScores = {
    drought: parseFloat(hazardScores.drought || hazardScores.droughtScore || 0),
    flood: parseFloat(hazardScores.flood || hazardScores.floodScore || 0),
    locust: parseFloat(hazardScores.locust || hazardScores.locustScore || 0),
    vegetation: parseFloat(hazardScores.vegetation || hazardScores.vegetationScore || 0),
  };

  const result = calculateCompositeRisk(normalizedScores);
  const recommendations = generateRecommendations(result.alertLevel, result.primaryThreat);

  let record = null;
  if (isConnected()) {
    record = await prisma.riskAssessment.create({
      data: {
        woredaId,
        droughtScore: normalizedScores.drought,
        floodScore: normalizedScores.flood,
        locustScore: normalizedScores.locust,
        vegetationScore: normalizedScores.vegetation,
        compositeScore: result.compositeScore,
        alertLevel: result.alertLevel,
        assessedAt: new Date(),
      },
    });
    record.recommendations = recommendations;
  } else {
    record = {
      id: `risk_${Date.now()}`,
      woredaId: woredaId || 'woreda_adama_01',
      ...normalizedScores,
      ...result,
      recommendations,
      assessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    _mockAssessments.unshift(record);
  }

  try {
    broadcastRiskUpdate(woredaId, record);
  } catch (_e) {
    // Non-fatal if websocket not active
  }
  return record;
}

// Get recent risk assessments
async function getLatestAssessments(limit = 20) {
  if (isConnected()) {
    return await prisma.riskAssessment.findMany({ orderBy: { assessedAt: 'desc' }, take: limit });
  }

  return _mockAssessments.length > 0
    ? _mockAssessments.slice(0, limit)
    : [
        {
          id: 'risk_01',
          woredaId: 'woreda_adama_01',
          compositeScore: 0.38,
          alertLevel: 'YELLOW',
          primaryThreat: 'DROUGHT',
          recommendations: generateRecommendations('YELLOW', 'DROUGHT'),
          assessedAt: new Date().toISOString(),
        },
      ];
}

// Get assessments by woreda
async function getAssessmentsByWoreda(woredaId) {
  if (isConnected() && woredaId) {
    return await prisma.riskAssessment.findMany({
      where: { woredaId },
      orderBy: { assessedAt: 'desc' },
    });
  }

  const results = _mockAssessments.filter((r) => r.woredaId === woredaId);
  return results.length > 0
    ? results
    : [
        {
          id: 'risk_01',
          woredaId: woredaId || 'woreda_adama_01',
          compositeScore: 0.45,
          alertLevel: 'HIGH',
          primaryThreat: 'DROUGHT',
          recommendations: generateRecommendations('HIGH', 'DROUGHT'),
          assessedAt: new Date().toISOString(),
        },
      ];
}

// Get risk statistics
async function getRiskStatistics() {
  if (isConnected()) {
    const total = await prisma.riskAssessment.count();
    const high = await prisma.riskAssessment.count({
      where: { alertLevel: { in: ['RED', 'CRITICAL', 'HIGH'] } },
    });
    const moderate = await prisma.riskAssessment.count({
      where: { alertLevel: { in: ['YELLOW', 'ORANGE', 'MODERATE'] } },
    });
    const low = await prisma.riskAssessment.count({
      where: { alertLevel: { in: ['GREEN', 'LOW', 'NORMAL'] } },
    });
    return { totalAssessments: total, criticalOrHigh: high, moderate, normal: low };
  }

  return {
    totalAssessments: 18,
    criticalOrHigh: 3,
    moderate: 6,
    normal: 9,
    averageCompositeRisk: 0.36,
  };
}

module.exports = {
  evaluateWoredaRisk,
  getLatestAssessments,
  getAssessmentsByWoreda,
  getRiskStatistics,
};
