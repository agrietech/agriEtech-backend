const { prisma, isConnected } = require('../../config/db');

// List regions
async function getRegions() {
  if (isConnected()) {
    return await prisma.region.findMany({ include: { zones: true } });
  }
  return [
    { id: 'reg_oromia', nameEn: 'Oromia', nameAm: 'ኦሮሚያ', code: 'ET-OR' },
    { id: 'reg_amhara', nameEn: 'Amhara', nameAm: 'አማራ', code: 'ET-AM' },
    { id: 'reg_tigray', nameEn: 'Tigray', nameAm: 'ትግራይ', code: 'ET-TI' },
    { id: 'reg_somali', nameEn: 'Somali', nameAm: 'ሶማሌ', code: 'ET-SO' },
    { id: 'reg_sidama', nameEn: 'Sidama', nameAm: 'ሲዳማ', code: 'ET-SI' },
  ];
}

// List woredas filtered by zone
async function getWoredasByZone(zoneId) {
  if (isConnected() && zoneId) {
    return await prisma.woreda.findMany({ where: { zoneId } });
  }
  return [
    {
      id: 'woreda_adama_01',
      nameEn: 'Adama Zuria',
      nameAm: 'አዳማ ዙሪያ',
      zoneId: zoneId || 'zone_east_shewa_01',
      centerLat: 8.54,
      centerLng: 39.27,
    },
    {
      id: 'woreda_bishoftu_02',
      nameEn: 'Bishoftu',
      nameAm: 'ቢሾፍቱ',
      zoneId: zoneId || 'zone_east_shewa_01',
      centerLat: 8.75,
      centerLng: 38.98,
    },
  ];
}

// Get woreda boundary detail
async function getWoredaById(id) {
  if (isConnected()) {
    return await prisma.woreda.findUnique({ where: { id } });
  }
  return {
    id: id || 'woreda_adama_01',
    nameEn: id === 'woreda_bishoftu_02' ? 'Bishoftu' : 'Adama Zuria',
    nameAm: id === 'woreda_bishoftu_02' ? 'ቢሾፍቱ' : 'አዳማ ዙሪያ',
    centerLat: id === 'woreda_bishoftu_02' ? 8.75 : 8.54,
    centerLng: id === 'woreda_bishoftu_02' ? 38.98 : 39.27,
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [32.5, 3.0],
          [48.5, 3.0],
          [48.5, 15.5],
          [32.5, 15.5],
          [32.5, 3.0],
        ],
      ],
    },
  };
}

module.exports = {
  getRegions,
  getWoredasByZone,
  getWoredaById,
};
