const { prisma, isConnected } = require('../../config/db');

// List regions
async function getRegions() {
  if (isConnected()) {
    return await prisma.region.findMany({ include: { zones: true } });
  }
  return [
    { id: 'reg_oromia', name: 'Oromia', code: 'ET-OR' },
    { id: 'reg_amhara', name: 'Amhara', code: 'ET-AM' },
  ];
}

// List woredas filtered by zone
async function getWoredasByZone(zoneId) {
  if (isConnected() && zoneId) {
    return await prisma.woreda.findMany({ where: { zoneId } });
  }
  return [{ id: 'woreda_adama_01', name: 'Adama Zuria', zoneId: zoneId || 'zone_east_shewa' }];
}

// Get woreda boundary detail
async function getWoredaById(id) {
  if (isConnected()) {
    return await prisma.woreda.findUnique({ where: { id } });
  }
  return { id, name: 'Adama Zuria', centerLat: 8.54, centerLng: 39.27 };
}

module.exports = {
  getRegions,
  getWoredasByZone,
  getWoredaById,
};
