const { prisma, isConnected } = require('../../config/db');
const { ServiceUnavailableError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const centroid = require('@turf/centroid').default || require('@turf/centroid');
const { getCoord } = require('@turf/invariant');
const boundariesService = require('../boundaries/boundaries.service');
const { assertContainedByWoreda, createHttpError, validateFarmPolygon } = require('./farmGeometry');

// Ethiopian geographic bounding box (approximate)
const ETHIOPIA_BOUNDS = { minLat: 3.0, maxLat: 15.5, minLng: 32.5, maxLng: 48.5 };

/**
 * Register a new farm plot.
 */
async function createFarm({
  userId,
  farmName,
  primaryCrop,
  areaHectares,
  woredaId,
  polygonGeojson,
  latitude: inputLat,
  longitude: inputLng,
  soilType,
  irrigationType,
}) {
  let resolvedWoredaId = woredaId;

  // Validate coordinates if provided directly
  if (inputLat !== undefined && inputLat !== null && inputLng !== undefined && inputLng !== null) {
    const lat = Number(inputLat);
    const lng = Number(inputLng);
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < ETHIOPIA_BOUNDS.minLat ||
      lat > ETHIOPIA_BOUNDS.maxLat ||
      lng < ETHIOPIA_BOUNDS.minLng ||
      lng > ETHIOPIA_BOUNDS.maxLng
    ) {
      throw createHttpError('Coordinates fall outside Ethiopia', 400);
    }

    if (!resolvedWoredaId) {
      resolvedWoredaId = await boundariesService.resolveWoredaByCoords(lat, lng);
    }
  }

  let finalPolygon = polygonGeojson;
  if (!finalPolygon && inputLat !== undefined && inputLng !== undefined) {
    const lat = Number(inputLat);
    const lng = Number(inputLng);
    const offset = 0.002; // ~220m box for point GPS capture
    finalPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [lng - offset, lat - offset],
          [lng + offset, lat - offset],
          [lng + offset, lat + offset],
          [lng - offset, lat + offset],
          [lng - offset, lat - offset],
        ],
      ],
    };
  }

  if (!finalPolygon) {
    throw createHttpError('polygonGeojson or valid latitude/longitude is required', 400);
  }

  // Step 1 – deep polygon validation (coordinate ranges, closure, kinks)
  const farmPolygon = validateFarmPolygon(finalPolygon);

  // Step 2 – derive centroid for the flat lat/lng columns
  const [derivedLng, derivedLat] = getCoord(centroid(farmPolygon));
  const latitude = inputLat !== undefined && inputLat !== null ? Number(inputLat) : derivedLat;
  const longitude = inputLng !== undefined && inputLng !== null ? Number(inputLng) : derivedLng;

  if (!resolvedWoredaId) {
    resolvedWoredaId = await boundariesService.resolveWoredaByCoords(latitude, longitude);
  }

  // Step 3 – retrieve woreda and its boundary
  let woreda = await boundariesService.getWoredaById(resolvedWoredaId);
  if (!woreda) {
    throw createHttpError('Selected woreda was not found', 404);
  }

    if (woreda && woreda.geojson) {
    // Step 4 – spatial containment check
    try {
      assertContainedByWoreda(farmPolygon, woreda.geojson);
    } catch (_containmentErr) {
      const matchedWoredaId = await boundariesService.resolveWoredaByCoords(latitude, longitude);
      if (matchedWoredaId && matchedWoredaId !== resolvedWoredaId) {
        resolvedWoredaId = matchedWoredaId;
        const matchedWoreda = await boundariesService.getWoredaById(resolvedWoredaId);
        if (matchedWoreda) woreda = matchedWoreda;
      }
    }
  }

  if (isConnected()) {
    return await prisma.$transaction(async (tx) => {
      let cropId = null;
      if (primaryCrop) {
        try {
          const cropRecord = await tx.crop.findFirst({
            where: {
              OR: [
                { nameEn: { equals: primaryCrop, mode: 'insensitive' } },
                { nameAm: { equals: primaryCrop } },
                { nameOm: { equals: primaryCrop, mode: 'insensitive' } },
              ],
            },
          });
          if (cropRecord) cropId = cropRecord.id;
        } catch (_err) {
          // Crop lookup fallback
        }
      }

      const farm = await tx.farm.create({
        data: {
          userId,
          farmName,
          primaryCrop: primaryCrop || null,
          cropId,
          areaHectares: areaHectares ?? null,
          latitude,
          longitude,
          woredaId: resolvedWoredaId,
          polygonGeojson: farmPolygon.geometry,
          soilType: soilType || null,
          irrigationType: irrigationType || null,
        },
      });

      return farm;
    });
  }

  throw new ServiceUnavailableError('Database service unavailable for farm creation');
}

// Get farms by user role & jurisdictional scope
async function getFarmsByScope(user = {}) {
  const role = (user.role || 'FARMER').toUpperCase();
  const userId = user.id;

  const where = {};
  if (role === 'FARMER') {
    where.userId = userId;
  } else if (role === 'DEVELOPMENT_AGENT' || role === 'WOREDA_OFFICER') {
    if (user.woredaId) {
      where.woredaId = user.woredaId;
    } else if (userId) {
      where.userId = userId;
    }
  } else if (role === 'ZONAL_OFFICER') {
    if (user.zoneId) {
      where.woreda = { zoneId: user.zoneId };
    }
  } else if (role === 'REGIONAL_OFFICER') {
    if (user.regionId) {
      where.woreda = { zone: { regionId: user.regionId } };
    }
  }

  return await prisma.farm.findMany({
    where,
    include: {
      woreda: {
        select: {
          id: true,
          nameEn: true,
          nameAm: true,
          zoneId: true,
          zone: { select: { id: true, nameEn: true, regionId: true } },
        },
      },
      crop: true,
      sensors: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Get farms for authenticated user
async function getFarmsByUser(userId) {
  return getFarmsByScope({ id: userId, role: 'FARMER' });
}

// Get farm by ID
async function getFarmById(id) {
  return await prisma.farm.findUnique({
    where: { id },
    include: {
      woreda: {
        select: {
          id: true,
          nameEn: true,
          nameAm: true,
          zoneId: true,
          zone: { select: { id: true, nameEn: true, regionId: true } },
        },
      },
      crop: true,
      sensors: { select: { id: true, hardwareId: true, sensorType: true, isActive: true } },
    },
  });
}

module.exports = {
  createFarm,
  registerFarm: createFarm,
  getFarmsByScope,
  getFarmsByUser,
  getFarmById,
};
