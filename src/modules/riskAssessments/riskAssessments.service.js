const { prisma, isConnected } = require('../../config/db');
const { calculateCompositeRisk } = require('../../processing/riskAggregator');
const { broadcastRiskUpdate } = require('../../delivery/websocket/riskAssessmentChannel');
const { getWoredaCoordinates } = require('../boundaries/boundaries.service');
const redis = require('../../config/redis');
const logger = require('../../utils/logger');

const RISK_CACHE_TTL = 30 * 60; // 30 minutes
function riskCacheKey(woredaId) { return `risk:latest:${woredaId}`; }

const inMemoryRiskAssessments = new Map();

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
  const coords = getWoredaCoordinates(woredaId);
  const normalizedScores = {
    drought: parseFloat(hazardScores.drought || hazardScores.droughtScore || 0.25),
    flood: parseFloat(hazardScores.flood || hazardScores.floodScore || 0.10),
    locust: parseFloat(hazardScores.locust || hazardScores.locustScore || 0.05),
    vegetation: parseFloat(hazardScores.vegetation || hazardScores.vegetationScore || 0.30),
  };

  const result = calculateCompositeRisk(normalizedScores);
  const recommendations = generateRecommendations(result.alertLevel, result.primaryThreat);

  let record = null;

  if (isConnected()) {
    try {
      record = await prisma.riskAssessment.create({
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
      });
    } catch (_err) {
      // Fallback
    }
  }

  if (!record) {
    record = {
      id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      woredaId: coords.id || woredaId,
      woreda: { id: coords.id || woredaId, nameEn: coords.nameEn, nameAm: coords.nameAm },
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
    inMemoryRiskAssessments.set(record.id, record);
  }

  // Invalidate Redis cache for this woreda after new computation
  try {
    if (redis.isConnected && redis.isConnected()) {
      await redis.del(riskCacheKey(woredaId));
    }
  } catch (_cacheErr) { /* non-fatal */ }

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

  return Array.from(inMemoryRiskAssessments.values()).slice(0, limit);
}

// Get assessments by woreda (with Redis caching)
async function getAssessmentsByWoreda(woredaId) {
  // 1. Check Redis cache first
  if (woredaId && redis.isConnected && redis.isConnected()) {
    try {
      const cached = await redis.get(riskCacheKey(woredaId));
      if (cached) {
        logger.debug(`[RiskAssessments] Cache HIT for woreda ${woredaId}`);
        return JSON.parse(cached);
      }
    } catch (_cacheErr) { /* fall through to DB */ }
  }

  // 2. Query database
  if (isConnected()) {
    try {
      if (!woredaId) return [];
      const rows = await prisma.riskAssessment.findMany({
        where: { woredaId },
        orderBy: { assessedAt: 'desc' },
      });

      // Cache the result
      if (rows.length > 0 && redis.isConnected && redis.isConnected()) {
        try {
          await redis.setex(riskCacheKey(woredaId), RISK_CACHE_TTL, JSON.stringify(rows));
        } catch (_cacheErr) { /* non-fatal */ }
      }
      return rows;
    } catch (_err) {
      // Fallback
    }
  }

  const all = Array.from(inMemoryRiskAssessments.values());
  const filtered = all.filter((r) => !woredaId || r.woredaId === woredaId);
  if (filtered.length > 0) return filtered;

  // If none recorded yet for this specific woreda, generate a live baseline assessment
  if (woredaId) {
    const baseline = await evaluateWoredaRisk(woredaId);
    return [baseline];
  }

  return [];
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

  const list = Array.from(inMemoryRiskAssessments.values());
  const high = list.filter((r) => ['RED', 'CRITICAL', 'HIGH'].includes(r.alertLevel)).length;
  const moderate = list.filter((r) => ['YELLOW', 'ORANGE', 'MODERATE', 'WATCH'].includes(r.alertLevel)).length;
  const low = list.filter((r) => ['GREEN', 'LOW', 'NORMAL'].includes(r.alertLevel)).length;

  return { total: list.length, high, moderate, low };
}

module.exports = {
  evaluateWoredaRisk,
  getLatestAssessments,
  getAssessmentsByWoreda,
  getRiskStatistics,
  inMemoryRiskAssessments,
};
