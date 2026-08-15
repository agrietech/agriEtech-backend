const { prisma, isConnected } = require('../../config/db');

// Register a farm plot
async function createFarm({ userId, name, cropType, areaHectares, lat, lng, woredaId }) {
  if (isConnected()) {
    return await prisma.farm.create({
      data: {
        userId,
        name,
        cropType,
        areaHectares: parseFloat(areaHectares) || 1.0,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        woredaId,
      },
    });
  }

  return {
    id: `farm_${Date.now()}`,
    userId,
    name,
    cropType,
    areaHectares,
    latitude: lat,
    longitude: lng,
    woredaId,
  };
}

// Get farms for authenticated user
async function getFarmsByUser(userId) {
  if (isConnected() && userId) {
    return await prisma.farm.findMany({ where: { userId } });
  }
  return [
    { id: 'farm_01', name: 'Adama Teff Plot', cropType: 'Teff', latitude: 8.54, longitude: 39.27 },
  ];
}

// Get farm by ID
async function getFarmById(id) {
  if (isConnected()) {
    return await prisma.farm.findUnique({ where: { id } });
  }
  return { id, name: 'Adama Teff Plot', cropType: 'Teff', areaHectares: 2.0 };
}

module.exports = {
  createFarm,
  getFarmsByUser,
  getFarmById,
};
