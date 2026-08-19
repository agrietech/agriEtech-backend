const { prisma, isConnected } = require('../../config/db');
const centroid = require('@turf/centroid').default || require('@turf/centroid');
const { getCoord } = require('@turf/invariant');
const boundariesService = require('../boundaries/boundaries.service');
const { assertContainedByWoreda, createHttpError, validateFarmPolygon } = require('./farmGeometry');

const inMemoryFarms = new Map();

// Ethiopian geographic bounding box (approximate)
const ETHIOPIA_BOUNDS = { minLat: 3.0, maxLat: 15.5, minLng: 32.5, maxLng: 48.5 };

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
  const targetWoredaId = woredaId || 'woreda_adama_01';
  const woreda = await boundariesService.getWoredaById(targetWoredaId);
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

  // Step 5 – persist
  if (!isConnected()) {
    // Offline / dev stub fallback
    const mockFarm = {
      id: `farm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      farmName,
      primaryCrop: primaryCrop || null,
      areaHectares: areaHectares ?? null,
      latitude,
      longitude,
      woredaId: targetWoredaId,
      polygonGeojson: farmPolygon.geometry,
      createdAt: new Date().toISOString(),
    };
    inMemoryFarms.set(mockFarm.id, mockFarm);
    return mockFarm;
  }

  return prisma.$transaction(async (tx) => {
    const farm = await tx.farm.create({
      data: {
        userId,
        farmName,
        primaryCrop: primaryCrop || null,
        areaHectares: areaHectares ?? null,
        latitude,
        longitude,
        woredaId: targetWoredaId,
        polygonGeojson: farmPolygon.geometry,
      },
    });

    // Write native PostGIS geometry for spatial queries
    await tx.$executeRaw`
      UPDATE "Farm"
      SET "spatialBoundary" = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(farmPolygon.geometry)}), 4326)
      WHERE id = ${farm.id}
    `;

    return farm;
  });
}

// Get farms for authenticated user
async function getFarmsByUser(userId) {
  if (isConnected() && userId) {
    return await prisma.farm.findMany({ where: { userId } });
  }
  const userFarms = Array.from(inMemoryFarms.values()).filter((f) => !userId || f.userId === userId);
  if (userFarms.length > 0) return userFarms;
  return [
    { id: 'farm_01', farmName: 'Adama Teff Plot', primaryCrop: 'Teff', latitude: 8.54, longitude: 39.27, userId },
  ];
}

// Get farm by ID
async function getFarmById(id) {
  if (isConnected()) {
    return await prisma.farm.findUnique({ where: { id } });
  }
  if (inMemoryFarms.has(id)) {
    return inMemoryFarms.get(id);
  }
  return { id, farmName: 'Adama Teff Plot', primaryCrop: 'Teff', areaHectares: 2.0 };
}

module.exports = {
  createFarm,
  getFarmsByUser,
  getFarmById,
};
