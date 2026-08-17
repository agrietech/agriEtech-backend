const { Prisma } = require('@prisma/client');
const { prisma, isConnected } = require('../../config/db');

const HIGH_RISK_LEVELS = ['HIGH', 'CRITICAL'];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function average(values) {
  const numericValues = values.filter((value) => typeof value === 'number');
  return numericValues.length
    ? numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
    : null;
}

function emptyMetrics() {
  return {
    farmsByWoreda: new Map(),
    latestRisks: new Map(),
    latestObservations: [],
    alertsByWoreda: new Map(),
  };
}

function cropHealth(observations) {
  return {
    latestObservationCount: observations.length,
    averageModisNdvi: average(observations.map((observation) => observation.modisNdvi)),
    averageSentinel2Ndvi: average(observations.map((observation) => observation.sentinel2Ndvi)),
  };
}

// Fetch only the newest risk and NDVI row per woreda. This avoids loading the
// full history into memory and uses the existing woreda/date database indexes.
async function getMetricsForWoredas(woredaIds) {
  if (!isConnected() || woredaIds.length === 0) return emptyMetrics();

  const ids = Prisma.join(woredaIds);
  const [farmGroups, risks, observations, alertGroups] = await Promise.all([
    prisma.farm.groupBy({
      by: ['woredaId'],
      where: { woredaId: { in: woredaIds } },
      _count: { _all: true },
    }),
    prisma.$queryRaw`
      SELECT DISTINCT ON ("woredaId")
        "woredaId", "riskLevel", "riskScore", "hazardType", "assessmentDate"
      FROM "RiskAssessment"
      WHERE "woredaId" IN (${ids})
      ORDER BY "woredaId", "assessmentDate" DESC
    `,
    prisma.$queryRaw`
      SELECT DISTINCT ON ("woredaId")
        "woredaId", "observationDate", "modisNdvi", "sentinel2Ndvi"
      FROM "SatelliteObservation"
      WHERE "woredaId" IN (${ids})
      ORDER BY "woredaId", "observationDate" DESC
    `,
    prisma.alert.groupBy({
      by: ['woredaId'],
      where: { woredaId: { in: woredaIds }, severity: { in: HIGH_RISK_LEVELS } },
      _count: { _all: true },
    }),
  ]);

  return {
    farmsByWoreda: new Map(farmGroups.map((group) => [group.woredaId, group._count._all])),
    latestRisks: new Map(risks.map((risk) => [risk.woredaId, risk])),
    latestObservations: observations,
    alertsByWoreda: new Map(alertGroups.map((group) => [group.woredaId, group._count._all])),
  };
}

function buildSummary(woredas, metrics) {
  const highRiskFarmClusters = woredas
    .map((woreda) => {
      const risk = metrics.latestRisks.get(woreda.id);
      if (!risk || !HIGH_RISK_LEVELS.includes(risk.riskLevel)) return null;

      return {
        woredaId: woreda.id,
        woredaName: woreda.nameEn,
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
        primaryHazard: risk.hazardType,
        assessedAt: risk.assessmentDate,
        farmsRegistered: metrics.farmsByWoreda.get(woreda.id) || 0,
        activeHighSeverityAlerts: metrics.alertsByWoreda.get(woreda.id) || 0,
      };
    })
    .filter(Boolean);

  return {
    monitoredWoredas: woredas.length,
    farmsRegistered: [...metrics.farmsByWoreda.values()].reduce((sum, count) => sum + count, 0),
    highRiskFarmClusters,
    cropHealth: cropHealth(metrics.latestObservations),
  };
}

async function getWoredaSummary(woredaId) {
  if (!woredaId) throw createHttpError('woredaId is required');
  if (!isConnected()) return { woreda: { id: woredaId }, ...buildSummary([], emptyMetrics()) };

  const woreda = await prisma.woreda.findUnique({
    where: { id: woredaId },
    select: {
      id: true,
      nameEn: true,
      nameAm: true,
      zone: { select: { id: true, nameEn: true, region: { select: { id: true, nameEn: true } } } },
    },
  });
  if (!woreda) throw createHttpError('Woreda not found', 404);

  const metrics = await getMetricsForWoredas([woreda.id]);
  return {
    woreda,
    ...buildSummary([woreda], metrics),
    latestRiskAssessment: metrics.latestRisks.get(woreda.id) || null,
    activeHighSeverityAlerts: metrics.alertsByWoreda.get(woreda.id) || 0,
  };
}

async function getRegionalSummary(regionId) {
  if (!regionId) throw createHttpError('regionId is required');
  if (!isConnected()) return { region: { id: regionId }, ...buildSummary([], emptyMetrics()) };

  const region = await prisma.region.findUnique({
    where: { id: regionId },
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAm: true,
      zones: { select: { id: true, nameEn: true, woredas: { select: { id: true, nameEn: true } } } },
    },
  });
  if (!region) throw createHttpError('Region not found', 404);

  const woredas = region.zones.flatMap((zone) =>
    zone.woredas.map((woreda) => ({ ...woreda, zone: { id: zone.id, nameEn: zone.nameEn } }))
  );
  const metrics = await getMetricsForWoredas(woredas.map((woreda) => woreda.id));

  return {
    region: { id: region.id, code: region.code, nameEn: region.nameEn, nameAm: region.nameAm },
    ...buildSummary(woredas, metrics),
  };
}

async function getNationalSummary() {
  if (!isConnected()) return buildSummary([], emptyMetrics());
  const woredas = await prisma.woreda.findMany({
    select: {
      id: true,
      nameEn: true,
      zone: { select: { id: true, nameEn: true, region: { select: { id: true, nameEn: true } } } },
    },
  });
  return buildSummary(woredas, await getMetricsForWoredas(woredas.map((woreda) => woreda.id)));
}

async function getRegionalBreakdown() {
  if (!isConnected()) return [];
  const regions = await prisma.region.findMany({ select: { id: true } });
  return Promise.all(regions.map((region) => getRegionalSummary(region.id)));
}

module.exports = {
  getDashboardSummary: getNationalSummary,
  getNationalSummary,
  getRegionalBreakdown,
  getRegionalSummary,
  getWoredaSummary,
};
