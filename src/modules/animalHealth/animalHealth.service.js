/**
 * @file animalHealth.service.js
 * @description Animal Health & Livestock Surveillance Service for Ethiopia.
 * Covers disease outbreak tracking, livestock population registry, vaccination campaigns,
 * pasture/forage condition monitoring, and veterinary calendar management.
 */

const { prisma } = require('../../config/db');
const { LIVESTOCK_DISEASES, ETHIOPIAN_LIVESTOCK_BREEDS, getDiseaseById, getDiseasesByAnimalType, getZoonoticDiseases, getNotifiableDiseases, getSeasonalHighRiskDiseases } = require('./diseaseDatabase');
const { VETERINARY_CALENDAR, getUpcomingVetTasks } = require('./veterinaryCalendar');
const earthEngineConnector = require('../../ingestion/connectors/earthEngineConnector');
const { getWoredaCoordinates } = require('../boundaries/boundaries.service');
const redis = require('../../config/redis');
const logger = require('../../utils/logger');

const ANIMAL_HEALTH_CACHE_TTL = 30 * 60; // 30 min

// ─── Disease Reference ────────────────────────────────────────────────────────

function getAllDiseases({ animalType, zoonotic, notifiable, season } = {}) {
  let diseases = [...LIVESTOCK_DISEASES];

  if (animalType) {
    diseases = getDiseasesByAnimalType(animalType);
  }
  if (zoonotic === 'true' || zoonotic === true) {
    diseases = diseases.filter((d) => d.isZoonotic);
  }
  if (notifiable === 'true' || notifiable === true) {
    diseases = diseases.filter((d) => d.isNotifiable);
  }
  if (season) {
    diseases = diseases.filter((d) => {
      const risk = d.seasonalRisk[season.toUpperCase()];
      return risk === 'CRITICAL' || risk === 'HIGH';
    });
  }

  return {
    totalDiseases: diseases.length,
    diseases,
    breeds: ETHIOPIAN_LIVESTOCK_BREEDS,
  };
}

function getDiseaseDetails(diseaseId) {
  const disease = getDiseaseById(diseaseId);
  if (!disease) return null;
  return disease;
}

// ─── Disease Outbreak Reporting & Tracking ────────────────────────────────────

async function reportOutbreak({
  woredaId,
  kebeleId,
  diseaseName,
  diseaseId,
  animalType,
  confirmedCases,
  suspectedCases,
  deaths,
  severity,
  reportedBy,
  reporterPhone,
  notes,
  latitude,
  longitude,
}) {
  const coords = await getWoredaCoordinates(woredaId);

  // Look up disease details from database
  const diseaseInfo = diseaseId ? getDiseaseById(diseaseId) : null;
  const resolvedDiseaseName = diseaseName || (diseaseInfo ? diseaseInfo.nameEn : 'Unknown Disease');
  const resolvedSeverity = severity || (diseaseInfo ? diseaseInfo.severity : 'MODERATE');

  const outbreak = {
    id: `outbreak_${woredaId}_${Date.now()}`,
    woredaId: coords.id || woredaId,
    woredaName: coords.nameEn,
    woredaNameAm: coords.nameAm,
    kebeleId: kebeleId || null,
    diseaseName: resolvedDiseaseName,
    diseaseId: diseaseId || null,
    diseaseCategory: diseaseInfo?.category || 'UNKNOWN',
    animalType: animalType || 'CATTLE',
    isZoonotic: diseaseInfo?.isZoonotic || false,
    isNotifiable: diseaseInfo?.isNotifiable || false,
    confirmedCases: Number(confirmedCases) || 0,
    suspectedCases: Number(suspectedCases) || 0,
    deaths: Number(deaths) || 0,
    mortalityRate: (Number(confirmedCases) || 1) > 0
      ? Math.round((Number(deaths) || 0) / (Number(confirmedCases) || 1) * 100)
      : 0,
    severity: resolvedSeverity,
    quarantineRecommended: resolvedSeverity === 'CRITICAL' || resolvedSeverity === 'HIGH',
    quarantineRadiusKm: diseaseInfo?.quarantineRadiusKm || 5,
    status: 'ACTIVE',
    coordinates: {
      lat: latitude || coords.lat,
      lng: longitude || coords.lng,
    },
    reportedBy: reportedBy || 'Field Officer',
    reporterPhone: reporterPhone || null,
    notes: notes || null,
    reportedAt: new Date().toISOString(),
    diseaseInfo: diseaseInfo ? {
      symptomsEn: diseaseInfo.symptomsEn,
      symptomsAm: diseaseInfo.symptomsAm,
      treatmentEn: diseaseInfo.treatmentEn,
      treatmentAm: diseaseInfo.treatmentAm,
      preventionEn: diseaseInfo.preventionEn,
      preventionAm: diseaseInfo.preventionAm,
    } : null,
  };

  // Persist to database if model exists
  try {
    await prisma.animalDiseaseOutbreak.create({
      data: {
        woredaId: outbreak.woredaId,
        kebeleId: outbreak.kebeleId,
        diseaseName: outbreak.diseaseName,
        diseaseId: outbreak.diseaseId,
        animalType: outbreak.animalType,
        confirmedCases: outbreak.confirmedCases,
        suspectedCases: outbreak.suspectedCases,
        deaths: outbreak.deaths,
        severity: outbreak.severity,
        status: 'ACTIVE',
        latitude: outbreak.coordinates.lat,
        longitude: outbreak.coordinates.lng,
        reportedBy: outbreak.reportedBy,
        notes: outbreak.notes,
      },
    });
    logger.info(`[AnimalHealth] Outbreak reported: ${outbreak.diseaseName} in ${outbreak.woredaName} (${outbreak.confirmedCases} cases)`);
  } catch (dbErr) {
    logger.warn(`[AnimalHealth] DB persist notice (outbreak will be returned but may not persist): ${dbErr.message}`);
  }

  return outbreak;
}

async function getOutbreaks({ woredaId, zoneId, regionId, status = 'ACTIVE', animalType, limit = 50 } = {}) {
  try {
    const where = {};
    if (status) where.status = status;
    if (woredaId) where.woredaId = woredaId;
    if (animalType) where.animalType = animalType;
    if (zoneId) where.woreda = { zoneId };
    if (regionId) where.woreda = { zone: { regionId } };

    const outbreaks = await prisma.animalDiseaseOutbreak.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
      take: Number(limit) || 50,
      include: {
        woreda: { select: { id: true, nameEn: true, nameAm: true } },
      },
    });

    return outbreaks;
  } catch (_err) {
    // If model doesn't exist yet, return empty
    logger.warn(`[AnimalHealth] Outbreaks query notice: model may not be migrated yet`);
    return [];
  }
}

// ─── Livestock Registry ───────────────────────────────────────────────────────

async function registerLivestock({
  woredaId,
  kebeleId,
  userId,
  animalType,
  breedName,
  headCount,
  healthStatus,
  notes,
}) {
  const coords = await getWoredaCoordinates(woredaId);

  const record = {
    id: `livestock_${woredaId}_${animalType}_${Date.now()}`,
    woredaId: coords.id || woredaId,
    woredaName: coords.nameEn,
    kebeleId: kebeleId || null,
    userId: userId || null,
    animalType: animalType || 'CATTLE',
    breedName: breedName || 'Mixed/Local',
    headCount: Number(headCount) || 0,
    healthStatus: healthStatus || 'HEALTHY',
    notes: notes || null,
    registeredAt: new Date().toISOString(),
    breedInfo: ETHIOPIAN_LIVESTOCK_BREEDS[animalType]?.find((b) => b.breed.toLowerCase() === (breedName || '').toLowerCase()) || null,
  };

  try {
    await prisma.livestockHerd.create({
      data: {
        woredaId: record.woredaId,
        kebeleId: record.kebeleId,
        userId: record.userId,
        animalType: record.animalType,
        breedName: record.breedName,
        headCount: record.headCount,
        healthStatus: record.healthStatus,
        notes: record.notes,
      },
    });
    logger.info(`[AnimalHealth] Livestock registered: ${record.headCount} ${record.animalType} in ${record.woredaName}`);
  } catch (dbErr) {
    logger.warn(`[AnimalHealth] Livestock DB persist notice: ${dbErr.message}`);
  }

  return record;
}

async function getLivestockByWoreda(woredaId) {
  try {
    return await prisma.livestockHerd.findMany({
      where: { woredaId },
      orderBy: { registeredAt: 'desc' },
      include: {
        woreda: { select: { id: true, nameEn: true, nameAm: true } },
      },
    });
  } catch (_err) {
    return [];
  }
}

// ─── Vaccination Campaigns ────────────────────────────────────────────────────

async function recordVaccination({
  woredaId,
  herdId,
  animalType,
  vaccineName,
  dosesAdministered,
  targetPopulation,
  campaignDate,
  nextDueDate,
  administeredBy,
}) {
  const coords = await getWoredaCoordinates(woredaId);
  const coverage = targetPopulation > 0
    ? Math.round((dosesAdministered / targetPopulation) * 100)
    : 0;

  const record = {
    id: `vax_${woredaId}_${Date.now()}`,
    woredaId: coords.id || woredaId,
    woredaName: coords.nameEn,
    herdId: herdId || null,
    animalType: animalType || 'CATTLE',
    vaccineName,
    dosesAdministered: Number(dosesAdministered) || 0,
    targetPopulation: Number(targetPopulation) || 0,
    coveragePercent: coverage,
    campaignDate: campaignDate || new Date().toISOString(),
    nextDueDate: nextDueDate || null,
    administeredBy: administeredBy || 'Woreda Veterinary Office',
    status: coverage >= 80 ? 'COMPLETE' : (coverage >= 50 ? 'IN_PROGRESS' : 'BELOW_TARGET'),
    recordedAt: new Date().toISOString(),
  };

  try {
    await prisma.vaccinationRecord.create({
      data: {
        woredaId: record.woredaId,
        herdId: record.herdId,
        animalType: record.animalType,
        vaccineName: record.vaccineName,
        dosesAdministered: record.dosesAdministered,
        targetPopulation: record.targetPopulation,
        coveragePercent: record.coveragePercent,
        campaignDate: new Date(record.campaignDate),
        nextDueDate: record.nextDueDate ? new Date(record.nextDueDate) : null,
        administeredBy: record.administeredBy,
      },
    });
  } catch (dbErr) {
    logger.warn(`[AnimalHealth] Vaccination DB persist notice: ${dbErr.message}`);
  }

  return record;
}

async function getVaccinationStatus({ woredaId, animalType } = {}) {
  try {
    const where = {};
    if (woredaId) where.woredaId = woredaId;
    if (animalType) where.animalType = animalType;

    return await prisma.vaccinationRecord.findMany({
      where,
      orderBy: { campaignDate: 'desc' },
      take: 50,
      include: {
        woreda: { select: { id: true, nameEn: true, nameAm: true } },
      },
    });
  } catch (_err) {
    return [];
  }
}

// ─── Pasture / Forage Condition ───────────────────────────────────────────────

async function getPastureCondition({ lat, lng, woredaId }) {
  let latitude = Number(lat);
  let longitude = Number(lng);
  let woredaName = null;

  if (woredaId && (!lat || !lng)) {
    const coords = await getWoredaCoordinates(woredaId);
    latitude = coords.lat;
    longitude = coords.lng;
    woredaName = coords.nameEn;
  }

  // Get vegetation indices from Earth Engine connector
  const planetary = await earthEngineConnector.fetchPlanetaryMetrics({
    lat: latitude,
    lng: longitude,
    level: 'KEBELE',
  });

  const ndvi = planetary.sentinel2Ndvi || 0.5;
  const soilMoisture = planetary.soilMoisturePct || 40;
  const month = new Date().getMonth() + 1;
  const season = month >= 6 && month <= 9 ? 'KIREMT' : (month >= 3 && month <= 5 ? 'BELG' : 'DRY');

  // Estimate forage quality from NDVI
  let forageQuality = 'POOR';
  let forageQualityAm = 'ዝቅተኛ የግጦሽ ሁኔታ';
  let carryingCapacity = 'Low — Supplemental feeding required';

  if (ndvi >= 0.65) {
    forageQuality = 'EXCELLENT';
    forageQualityAm = 'እጅግ ጥሩ የግጦሽ ሁኔታ';
    carryingCapacity = 'High — Natural grazing sufficient (4-6 TLU/ha)';
  } else if (ndvi >= 0.50) {
    forageQuality = 'GOOD';
    forageQualityAm = 'ጥሩ የግጦሽ ሁኔታ';
    carryingCapacity = 'Moderate — Light supplementation recommended (2-4 TLU/ha)';
  } else if (ndvi >= 0.35) {
    forageQuality = 'FAIR';
    forageQualityAm = 'መካከለኛ የግጦሽ ሁኔታ';
    carryingCapacity = 'Low-Moderate — Supplemental feeding needed (1-2 TLU/ha)';
  } else {
    carryingCapacity = 'Very Low — Emergency feed distribution needed (<1 TLU/ha)';
  }

  return {
    coordinates: { lat: latitude, lng: longitude },
    woredaName,
    assessedAt: new Date().toISOString(),
    season,
    vegetationIndices: {
      ndvi,
      evi: planetary.enhancedVegetationIndex || 0,
      ndwi: planetary.normalizedDifferenceWaterIndex || 0,
      moistureStressIndex: planetary.moistureStressIndex || 0,
    },
    soilMoisturePct: soilMoisture,
    forageAssessment: {
      quality: forageQuality,
      qualityAm: forageQualityAm,
      carryingCapacity,
      estimatedBiomassDryMatterKgPerHa: Math.round(ndvi * 4500),
    },
    waterAvailability: {
      soilMoisturePct: soilMoisture,
      surfaceWaterIndicator: planetary.normalizedDifferenceWaterIndex > 0.1 ? 'PRESENT' : 'SCARCE',
    },
    recommendations: {
      en: ndvi < 0.35
        ? ['Distribute emergency supplemental feed (hay, crop residues)', 'Move livestock to areas with better forage', 'Reduce stocking density immediately', 'Contact Woreda Livestock Office for feed support']
        : ['Maintain rotational grazing to prevent overgrazing', 'Monitor water point availability', 'Plan dry season feed reserves'],
      am: ndvi < 0.35
        ? ['ድንገተኛ ተጨማሪ መኖ ማከፋፈል (ድርቆሽ፣ ገለባ)', 'ከብቶችን ወደ ተሻለ ግጦሽ ያላቸው ቦታዎች ማዘዋወር', 'የከብቶችን ቁጥር ወዲያውኑ መቀነስ']
        : ['ከመጠን በላይ ግጦሽ ለመከላከል ማሰማሪያ ቦታን በተለዋዋጭ ማስተዳደር', 'የውሃ ቦታዎችን ዝግጁነት መከታተል'],
    },
  };
}

// ─── Combined Risk Assessment ─────────────────────────────────────────────────

async function getAnimalHealthRiskAssessment({ woredaId }) {
  const coords = await getWoredaCoordinates(woredaId);
  const month = new Date().getMonth() + 1;
  const season = month >= 6 && month <= 9 ? 'KIREMT' : (month >= 3 && month <= 5 ? 'BELG' : 'DRY');

  const seasonalDiseases = getSeasonalHighRiskDiseases(season);
  const zoonoticDiseases = getZoonoticDiseases();
  const upcomingVetTasks = getUpcomingVetTasks(month);
  const pasture = await getPastureCondition({ woredaId });

  let outbreakCount = 0;
  try {
    outbreakCount = await prisma.animalDiseaseOutbreak.count({
      where: { woredaId: coords.id || woredaId, status: 'ACTIVE' },
    });
  } catch (_e) { /* model may not exist */ }

  // Compute risk score
  let riskScore = 0.15; // baseline
  if (outbreakCount > 0) riskScore += 0.3;
  if (pasture.forageAssessment.quality === 'POOR') riskScore += 0.2;
  if (seasonalDiseases.length > 5) riskScore += 0.15;
  riskScore = Math.min(1.0, Math.round(riskScore * 100) / 100);

  let riskLevel = 'LOW';
  if (riskScore >= 0.7) riskLevel = 'CRITICAL';
  else if (riskScore >= 0.45) riskLevel = 'HIGH';
  else if (riskScore >= 0.25) riskLevel = 'MODERATE';

  return {
    woredaId: coords.id || woredaId,
    woredaName: coords.nameEn,
    woredaNameAm: coords.nameAm,
    assessedAt: new Date().toISOString(),
    season,
    riskScore,
    riskLevel,
    activeOutbreaks: outbreakCount,
    pastureCondition: pasture.forageAssessment.quality,
    seasonalHighRiskDiseases: seasonalDiseases.map((d) => ({
      id: d.id,
      nameEn: d.nameEn,
      nameAm: d.nameAm,
      animalTypes: d.animalTypes,
      severity: d.severity,
      isZoonotic: d.isZoonotic,
    })),
    zoonoticAlerts: zoonoticDiseases.length,
    upcomingVetTasks: upcomingVetTasks.tasks.slice(0, 10),
    upcomingTaskCount: upcomingVetTasks.upcomingTaskCount,
  };
}

module.exports = {
  // Disease Reference
  getAllDiseases,
  getDiseaseDetails,
  // Outbreak Tracking
  reportOutbreak,
  getOutbreaks,
  // Livestock Registry
  registerLivestock,
  getLivestockByWoreda,
  // Vaccination
  recordVaccination,
  getVaccinationStatus,
  // Pasture & Forage
  getPastureCondition,
  // Risk Assessment
  getAnimalHealthRiskAssessment,
  // Calendar
  getUpcomingVetTasks,
};
