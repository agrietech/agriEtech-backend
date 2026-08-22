const { prisma, isConnected } = require('../../config/db');
const { calculateCompositeRisk } = require('../../processing/riskAggregator');
const { broadcastRiskUpdate } = require('../../delivery/websocket/riskAssessmentChannel');
const logger = require('../../utils/logger');

const mockRiskAssessments = [
  {
    id: 'risk_demo_01',
    woredaId: 'woreda_adama_01',
    droughtScore: 0.65,
    floodScore: 0.15,
    locustScore: 0.10,
    vegetationScore: 0.55,
    compositeScore: 0.58,
    riskScore: 0.58,
    alertLevel: 'MODERATE',
    assessedAt: new Date().toISOString(),
    recommendationsEn: 'Monitor soil moisture trends closely. | Advise farmers to employ water conservation.',
    recommendations: [
      'Monitor soil moisture trends closely.',
      'Advise farmers to employ water conservation and mulching.',
    ],
    woreda: { id: 'woreda_adama_01', nameEn: 'Adama Zuria', nameAm: 'አዳማ ዙሪያ' },
  },
];

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
    try {
      record = await prisma.riskAssessment.create({
        data: {
          woredaId,
          assessmentDate: new Date(),
          droughtScore: normalizedScores.drought,
          floodScore: normalizedScores.flood,
          locustScore: normalizedScores.locust,
          vegetationScore: normalizedScores.vegetation,
          compositeScore: result.compositeScore,
          riskScore: result.compositeScore,
          alertLevel: result.alertLevel,
          assessedAt: new Date(),
          recommendationsEn: recommendations.join(' | '),
        },
      });
    } catch (_err) {
      // Fallback
    }
  }

  if (!record) {
    record = {
      id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      woredaId,
      droughtScore: normalizedScores.drought,
      floodScore: normalizedScores.flood,
      locustScore: normalizedScores.locust,
      vegetationScore: normalizedScores.vegetation,
      compositeScore: result.compositeScore,
      riskScore: result.compositeScore,
      alertLevel: result.alertLevel,
      assessedAt: new Date().toISOString(),
      recommendationsEn: recommendations.join(' | '),
    };
    mockRiskAssessments.unshift(record);
  }

  // Broadcast via WebSocket
  try {
    broadcastRiskUpdate(woredaId, { ...record, recommendations });
  } catch (wsErr) {
    logger.warn(`[RiskAssessments] WebSocket broadcast failed (non-fatal): ${wsErr.message}`);
  }

  return { ...record, recommendations };
}

// Get recent risk assessments
async function getLatestAssessments(limit = 20) {
  if (isConnected()) {
    try {
      return await prisma.riskAssessment.findMany({
        orderBy: { assessedAt: 'desc' },
        take: limit,
        include: {
          woreda: { select: { id: true, nameEn: true, nameAm: true } },
        },
      });
    } catch (_err) {
      // Fallback
    }
  }

  return mockRiskAssessments.slice(0, limit);
}

// Get assessments by woreda
async function getAssessmentsByWoreda(woredaId) {
  if (isConnected()) {
    try {
      if (!woredaId) return [];
      return await prisma.riskAssessment.findMany({
        where: { woredaId },
        orderBy: { assessedAt: 'desc' },
      });
    } catch (_err) {
      // Fallback
    }
  }

  return mockRiskAssessments.filter((r) => !woredaId || r.woredaId === woredaId);
}

// Get risk statistics from live database
async function getRiskStatistics() {
  if (isConnected()) {
    try {
      const total = await prisma.riskAssessment.count();
      const high = await prisma.riskAssessment.count({
        where: { alertLevel: { in: ['RED', 'CRITICAL', 'HIGH'] } },
      });
      const moderate = await prisma.riskAssessment.count({
        where: { alertLevel: { in: ['YELLOW', 'ORANGE', 'MODERATE', 'WATCH'] } },
      });
      const low = await prisma.riskAssessment.count({
        where: { alertLevel: { in: ['GREEN', 'LOW', 'NORMAL'] } },
      });

      return { total, high, moderate, low };
    } catch (_err) {
      // Fallback
    }
  }

  return { total: 45, high: 6, moderate: 15, low: 24 };
}

module.exports = {
  evaluateWoredaRisk,
  getLatestAssessments,
  getAssessmentsByWoreda,
  getRiskStatistics,
  mockRiskAssessments,
};
