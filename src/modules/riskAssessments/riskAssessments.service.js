const { prisma, isConnected } = require('../../config/db');
const { calculateCompositeRisk } = require('../../processing/riskAggregator');
const { broadcastRiskUpdate } = require('../../delivery/websocket/riskAssessmentChannel');
const { getWoredaCoordinates } = require('../boundaries/boundaries.service');
const redis = require('../../config/redis');
const logger = require('../../utils/logger');
const { NotFoundError } = require('../../utils/errors');

const RISK_CACHE_TTL = 30 * 60; // 30 minutes
function riskCacheKey(woredaId) { return `risk:latest:${woredaId}`; }

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

// Compute multi-hazard risk and persist assessment directly to PostgreSQL
async function evaluateWoredaRisk(woredaId, hazardScores = {}) {
  const coords = await getWoredaCoordinates(woredaId);
  const normalizedScores = {
    drought: parseFloat(hazardScores.drought || hazardScores.droughtScore || 0.25),
    flood: parseFloat(hazardScores.flood || hazardScores.floodScore || 0.10),
    locust: parseFloat(hazardScores.locust || hazardScores.locustScore || 0.05),
    vegetation: parseFloat(hazardScores.vegetation || hazardScores.vegetationScore || 0.30),
  };

  const result = calculateCompositeRisk(normalizedScores);
  const recommendations = generateRecommendations(result.alertLevel, result.primaryThreat);

  const record = await prisma.riskAssessment.create({
    data: {
      woredaId: coords.id || woredaId,
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
    include: {
      woreda: { select: { id: true, nameEn: true, nameAm: true } },
    },
  });

  // Invalidate Redis cache for this woreda after new computation
  try {
    if (redis && redis.isConnected && redis.isConnected()) {
      await redis.del(riskCacheKey(woredaId));
    }
  } catch (_cacheErr) { /* non-fatal */ }

  // Broadcast via WebSocket
  try {
    broadcastRiskUpdate(woredaId, { ...record, recommendations });
  } catch (wsErr) {
    logger.warn(`[RiskAssessments] WebSocket broadcast notice: ${wsErr.message}`);
  }

  return { ...record, recommendations };
}

// Get recent risk assessments
async function getLatestAssessments(limit = 20) {
  return await prisma.riskAssessment.findMany({
    orderBy: { assessedAt: 'desc' },
    take: Number(limit) || 20,
    include: {
      woreda: { select: { id: true, nameEn: true, nameAm: true } },
    },
  });
}

// Get assessments by woreda (with Redis caching)
async function getAssessmentsByWoreda(woredaId) {
  if (!woredaId) return [];

  // 1. Check Redis cache first
  if (redis && redis.isConnected && redis.isConnected()) {
    try {
      const cached = await redis.get(riskCacheKey(woredaId));
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_cacheErr) { /* fall through */ }
  }

  // 2. Query database
  let rows = await prisma.riskAssessment.findMany({
    where: { woredaId },
    orderBy: { assessedAt: 'desc' },
    include: {
      woreda: { select: { id: true, nameEn: true, nameAm: true } },
    },
  });

  // If none recorded yet, generate a live baseline assessment
  if (rows.length === 0) {
    const baseline = await evaluateWoredaRisk(woredaId);
    rows = [baseline];
  }

  // Cache the result
  if (rows.length > 0 && redis && redis.isConnected && redis.isConnected()) {
    try {
      await redis.set(riskCacheKey(woredaId), JSON.stringify(rows), 'EX', RISK_CACHE_TTL);
    } catch (_e) { /* non-fatal */ }
  }

  return rows;
}

// Get risk statistics from live database
async function getRiskStatistics() {
  const [total, high, moderate, low] = await Promise.all([
    prisma.riskAssessment.count(),
    prisma.riskAssessment.count({
      where: { alertLevel: { in: ['RED', 'CRITICAL', 'HIGH'] } },
    }),
    prisma.riskAssessment.count({
      where: { alertLevel: { in: ['YELLOW', 'ORANGE', 'MODERATE', 'WATCH'] } },
    }),
    prisma.riskAssessment.count({
      where: { alertLevel: { in: ['GREEN', 'LOW', 'NORMAL'] } },
    }),
  ]);

  return { total, high, moderate, low };
}

module.exports = {
  evaluateWoredaRisk,
  getLatestAssessments,
  getAssessmentsByWoreda,
  getRiskStatistics,
};
