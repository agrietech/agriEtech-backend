const { prisma, isConnected } = require('../../config/db');

/**
 * List all administrative regions with their zones
 */
async function getRegions() {
  if (isConnected()) {
    return await prisma.region.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        zones: {
          select: {
            id: true,
            nameEn: true,
            nameAm: true,
          },
          orderBy: { nameEn: 'asc' },
        },
      },
    });
  }
  return [
    { id: 'ET04', code: 'ET04', nameEn: 'Oromia', nameAm: 'ኦሮሚያ' },
    { id: 'ET03', code: 'ET03', nameEn: 'Amhara', nameAm: 'አማራ' },
    { id: 'ET01', code: 'ET01', nameEn: 'Tigray', nameAm: 'ትግራይ' },
    { id: 'ET05', code: 'ET05', nameEn: 'Somali', nameAm: 'ሶማሌ' },
    { id: 'ET10', code: 'ET10', nameEn: 'Sidama', nameAm: 'ሲዳማ' },
    { id: 'ET02', code: 'ET02', nameEn: 'Afar', nameAm: 'አፋር' },
    { id: 'ET14', code: 'ET14', nameEn: 'Addis Ababa', nameAm: 'አዲስ አበባ' },
    { id: 'ET15', code: 'ET15', nameEn: 'Dire Dawa', nameAm: 'ድሬዳዋ' },
  ];
}

/**
 * List zones optionally filtered by regionId
 */
async function getZones(regionId) {
  if (isConnected()) {
    const where = regionId ? { regionId } : {};
    return await prisma.zone.findMany({
      where,
      orderBy: { nameEn: 'asc' },
      include: {
        region: {
          select: { id: true, nameEn: true, code: true },
        },
      },
    });
  }
  return [
    { id: 'zone_east_shewa', nameEn: 'East Shewa', nameAm: 'ምስራቅ ሸዋ', regionId: 'ET04' },
    { id: 'zone_arsi', nameEn: 'Arsi', nameAm: 'አርሲ', regionId: 'ET04' },
    { id: 'zone_north_shewa', nameEn: 'North Shewa', nameAm: 'ሰሜን ሸዋ', regionId: 'ET03' },
  ];
}

/**
 * List woredas with optional filtering by zoneId or search query
 */
async function getWoredas({ zoneId, search, limit = 100, page = 1 } = {}) {
  if (isConnected()) {
    const where = {};
    if (zoneId) where.zoneId = zoneId;
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAm: { contains: search } },
      ];
    }

    const take = Math.min(parseInt(limit, 10) || 100, 500);
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const [total, woredas] = await Promise.all([
      prisma.woreda.count({ where }),
      prisma.woreda.findMany({
        where,
        take,
        skip,
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          zoneId: true,
          nameEn: true,
          nameAm: true,
          centerLat: true,
          centerLng: true,
          zone: {
            select: {
              id: true,
              nameEn: true,
              region: {
                select: { id: true, nameEn: true, code: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      page: parseInt(page, 10) || 1,
      limit: take,
      data: woredas,
    };
  }

  return {
    total: 2,
    page: 1,
    limit: 100,
    data: [
      {
        id: 'ET040101',
        nameEn: 'Adama Zuria',
        nameAm: 'አዳማ ዙሪያ',
        zoneId: zoneId || 'zone_east_shewa',
        centerLat: 8.54,
        centerLng: 39.27,
      },
      {
        id: 'ET040102',
        nameEn: 'Bishoftu',
        nameAm: 'ቢሾፍቱ',
        zoneId: zoneId || 'zone_east_shewa',
        centerLat: 8.75,
        centerLng: 38.98,
      },
    ],
  };
}

/**
 * Get woreda boundary detail including GeoJSON polygon
 */
async function getWoredaById(id) {
  if (isConnected()) {
    return await prisma.woreda.findUnique({
      where: { id },
      include: {
        zone: {
          include: {
            region: true,
          },
        },
      },
    });
  }
  return {
    id: id || 'ET040101',
    nameEn: id === 'ET040102' ? 'Bishoftu' : 'Adama Zuria',
    nameAm: id === 'ET040102' ? 'ቢሾፍቱ' : 'አዳማ ዙሪያ',
    centerLat: id === 'ET040102' ? 8.75 : 8.54,
    centerLng: id === 'ET040102' ? 38.98 : 39.27,
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [39.1, 8.4],
          [39.4, 8.4],
          [39.4, 8.7],
          [39.1, 8.7],
          [39.1, 8.4],
        ],
      ],
    },
  };
}

module.exports = {
  getRegions,
  getZones,
  getWoredas,
  getWoredaById,
};
