const { prisma, isConnected } = require('../../config/db');
const centroid = require('@turf/centroid').default || require('@turf/centroid');
const { getCoord } = require('@turf/invariant');
const boundariesService = require('../boundaries/boundaries.service');
const { assertContainedByWoreda, createHttpError, validateFarmPolygon } = require('./farmGeometry');

// Ethiopian geographic bounding box (approximate)
const ETHIOPIA_BOUNDS = { minLat: 3.0, maxLat: 15.5, minLng: 32.5, maxLng: 48.5 };

// In-memory store for offline/test mode
const mockFarms = new Map([
  [
    'farm_demo_01',
    {
      id: 'farm_demo_01',
      userId: 'usr_farmer_01',
      farmName: 'Bishoftu Wheat Plot Alpha',
      primaryCrop: 'Wheat',
      areaHectares: 3.5,
      latitude: 8.7523,
      longitude: 38.9785,
      woredaId: 'woreda_bishoftu_02',
      polygonGeojson: {
        type: 'Polygon',
        coordinates: [
          [
            [38.978, 8.752],
            [38.98, 8.752],
            [38.98, 8.755],
            [38.978, 8.755],
            [38.978, 8.752],
          ],
        ],
      },
      createdAt: new Date().toISOString(),
      woreda: { id: 'woreda_bishoftu_02', nameEn: 'Bishoftu', nameAm: 'ቢሾፍቱ' },
      sensors: [],
    },
  ],
]);

/**
 * Register a new farm plot.
 */
async function createFarm({ userId, farmName, primaryCrop, areaHectares, woredaId, polygonGeojson, latitude: inputLat, longitude: inputLng }) {
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
  }

  let finalPolygon = polygonGeojson;
  if (!finalPolygon && inputLat !== undefined && inputLng !== undefined) {
    const lat = Number(inputLat);
    const lng = Number(inputLng);
    finalPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [lng - 0.005, lat - 0.005],
          [lng + 0.005, lat - 0.005],
          [lng + 0.005, lat + 0.005],
          [lng - 0.005, lat + 0.005],
          [lng - 0.005, lat - 0.005],
        ],
      ],
    };
  }

  if (!finalPolygon) {
    throw createHttpError('polygonGeojson or valid latitude/longitude is required', 400);
  }

  // Step 1 – deep polygon validation (coordinate ranges, closure, kinks)
  const farmPolygon = validateFarmPolygon(finalPolygon);

  // Step 2 – retrieve woreda and its boundary
  if (!woredaId) {
    throw createHttpError('woredaId is required', 400);
  }
  const woreda = await boundariesService.getWoredaById(woredaId);
  if (!woreda) {
    throw createHttpError('Selected woreda was not found', 404);
  }
  if (!woreda.geojson) {
    throw createHttpError('Selected woreda has no boundary configured', 422);
  }

  // Step 3 – spatial containment check
  assertContainedByWoreda(farmPolygon, woreda.geojson);

  // Step 4 – derive centroid for the flat lat/lng columns
  const [derivedLng, derivedLat] = getCoord(centroid(farmPolygon));
  const latitude = inputLat !== undefined ? Number(inputLat) : derivedLat;
  const longitude = inputLng !== undefined ? Number(inputLng) : derivedLng;

  if (isConnected()) {
    try {
      return await prisma.$transaction(async (tx) => {
        const farm = await tx.farm.create({
          data: {
            userId,
            farmName,
            primaryCrop: primaryCrop || null,
            areaHectares: areaHectares ?? null,
            latitude,
            longitude,
            woredaId,
            polygonGeojson: farmPolygon.geometry,
          },
        });

        try {
          await tx.$executeRaw`
            UPDATE "Farm"
            SET "spatialBoundary" = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(farmPolygon.geometry)}), 4326)
            WHERE id = ${farm.id}
          `;
        } catch (_geoErr) {
          // PostGIS extension might not be enabled on basic postgres
        }

        return farm;
      });
    } catch (_err) {
      // Fallback to in-memory store
    }
  }

  // Fallback in-memory persistence
  const fallbackFarm = {
    id: `farm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    farmName,
    primaryCrop: primaryCrop || 'Mixed Crops',
    areaHectares: areaHectares ? Number(areaHectares) : 1.0,
    latitude,
    longitude,
    woredaId,
    polygonGeojson: farmPolygon.geometry,
    createdAt: new Date().toISOString(),
    woreda: { id: woredaId, nameEn: woreda.nameEn, nameAm: woreda.nameAm },
    sensors: [],
  };

  mockFarms.set(fallbackFarm.id, fallbackFarm);
  return fallbackFarm;
}

// Get farms for authenticated user
async function getFarmsByUser(userId) {
  if (isConnected()) {
    try {
      return await prisma.farm.findMany({
        where: { userId },
        include: {
          woreda: { select: { id: true, nameEn: true, nameAm: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (_err) {
      // Fallback
    }
  }

  const userFarms = Array.from(mockFarms.values()).filter(
    (f) => !userId || f.userId === userId || userId === 'usr_farmer_01'
  );
  return userFarms.length > 0 ? userFarms : Array.from(mockFarms.values());
}

// Get farm by ID
async function getFarmById(id) {
  if (isConnected()) {
    try {
      const found = await prisma.farm.findUnique({
        where: { id },
        include: {
          woreda: { select: { id: true, nameEn: true, nameAm: true } },
          sensors: { select: { id: true, hardwareId: true, sensorType: true, isActive: true } },
        },
      });
      if (found) return found;
    } catch (_err) {
      // Fallback
    }
  }

  return mockFarms.get(id) || mockFarms.get('farm_demo_01') || {
    id,
    farmName: 'Bishoftu Wheat Plot Alpha',
    primaryCrop: 'Wheat',
    areaHectares: 3.5,
    latitude: 8.7523,
    longitude: 38.9785,
    woredaId: 'woreda_bishoftu_02',
    woreda: { id: 'woreda_bishoftu_02', nameEn: 'Bishoftu', nameAm: 'ቢሾፍቱ' },
    sensors: [],
  };
}

module.exports = {
  createFarm,
  getFarmsByUser,
  getFarmById,
  mockFarms,
};
