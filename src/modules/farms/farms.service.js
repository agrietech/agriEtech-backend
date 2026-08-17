const { prisma, isConnected } = require('../../config/db');
const turf = require('@turf/turf');
const boundariesService = require('../boundaries/boundaries.service');
const { assertContainedByWoreda, createHttpError, validateFarmPolygon } = require('./farmGeometry');

/**
 * Register a new farm plot.
 *
 * 1. Validates the incoming GeoJSON polygon (structure, coordinates, self-intersection).
 * 2. Fetches the selected woreda and verifies it has a configured boundary.
 * 3. Asserts the entire farm polygon is spatially contained within the woreda.
 * 4. Computes centroid from the polygon for lat/lng fields.
 * 5. Persists the farm row + PostGIS geometry column in a single transaction.
 */
async function createFarm({ userId, farmName, primaryCrop, areaHectares, woredaId, polygonGeojson }) {
  // Step 1 – deep polygon validation (coordinate ranges, closure, kinks)
  const farmPolygon = validateFarmPolygon(polygonGeojson);

  // Step 2 – retrieve woreda and its boundary
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
  const [longitude, latitude] = turf.getCoord(turf.centroid(farmPolygon));

  // Step 5 – persist
  if (!isConnected()) {
    // Offline / dev stub fallback
    return {
      id: `farm_${Date.now()}`,
      userId,
      farmName,
      primaryCrop: primaryCrop || null,
      areaHectares: areaHectares ?? null,
      latitude,
      longitude,
      woredaId,
      polygonGeojson: farmPolygon.geometry,
    };
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
        woredaId,
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
  return [
    { id: 'farm_01', farmName: 'Adama Teff Plot', primaryCrop: 'Teff', latitude: 8.54, longitude: 39.27 },
  ];
}

// Get farm by ID
async function getFarmById(id) {
  if (isConnected()) {
    return await prisma.farm.findUnique({ where: { id } });
  }
  return { id, farmName: 'Adama Teff Plot', primaryCrop: 'Teff', areaHectares: 2.0 };
}

module.exports = {
  createFarm,
  getFarmsByUser,
  getFarmById,
};
