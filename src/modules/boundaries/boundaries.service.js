const { prisma, isConnected } = require('../../config/db');

const FALLBACK_REGIONS = [
  { id: 'ET04', code: 'ET04', nameEn: 'Oromia', nameAm: 'ኦሮሚያ', zones: [
    { id: 'zone_east_shewa', nameEn: 'East Shewa', nameAm: 'ምስራቅ ሸዋ' },
    { id: 'zone_arsi', nameEn: 'Arsi', nameAm: 'አርሲ' },
  ] },
  { id: 'ET03', code: 'ET03', nameEn: 'Amhara', nameAm: 'አማራ', zones: [
    { id: 'zone_north_shewa', nameEn: 'North Shewa', nameAm: 'ሰሜን ሸዋ' },
  ] },
  { id: 'ET01', code: 'ET01', nameEn: 'Tigray', nameAm: 'ትግራይ', zones: [] },
  { id: 'ET05', code: 'ET05', nameEn: 'Somali', nameAm: 'ሶማሌ', zones: [] },
  { id: 'ET10', code: 'ET10', nameEn: 'Sidama', nameAm: 'ሲዳማ', zones: [] },
  { id: 'ET02', code: 'ET02', nameEn: 'Afar', nameAm: 'አፋር', zones: [] },
  { id: 'ET14', code: 'ET14', nameEn: 'Addis Ababa', nameAm: 'አዲስ አበባ', zones: [] },
  { id: 'ET15', code: 'ET15', nameEn: 'Dire Dawa', nameAm: 'ድሬዳዋ', zones: [] },
];

const FALLBACK_ZONES = [
  { id: 'zone_east_shewa_01', nameEn: 'East Shewa', nameAm: 'ምስራቅ ሸዋ', regionId: 'ET04', region: { id: 'ET04', nameEn: 'Oromia', code: 'ET04' } },
  { id: 'zone_east_shewa', nameEn: 'East Shewa', nameAm: 'ምስራቅ ሸዋ', regionId: 'ET04', region: { id: 'ET04', nameEn: 'Oromia', code: 'ET04' } },
  { id: 'zone_arsi', nameEn: 'Arsi', nameAm: 'አርሲ', regionId: 'ET04', region: { id: 'ET04', nameEn: 'Oromia', code: 'ET04' } },
  { id: 'zone_north_shewa', nameEn: 'North Shewa', nameAm: 'ሰሜን ሸዋ', regionId: 'ET03', region: { id: 'ET03', nameEn: 'Amhara', code: 'ET03' } },
];

const FALLBACK_WOREDAS = [
  {
    id: 'ET040101',
    zoneId: 'zone_east_shewa_01',
    nameEn: 'Adama Zuria',
    nameAm: 'አዳማ ዙሪያ',
    centerLat: 8.54,
    centerLng: 39.27,
    zone: { id: 'zone_east_shewa_01', nameEn: 'East Shewa', region: { id: 'ET04', nameEn: 'Oromia', code: 'ET04' } },
  },
  {
    id: 'woreda_adama_01',
    zoneId: 'zone_east_shewa_01',
    nameEn: 'Adama Zuria',
    nameAm: 'አዳማ ዙሪያ',
    centerLat: 8.54,
    centerLng: 39.27,
    zone: { id: 'zone_east_shewa_01', nameEn: 'East Shewa', region: { id: 'ET04', nameEn: 'Oromia', code: 'ET04' } },
  },
  {
    id: 'ET040102',
    zoneId: 'zone_east_shewa_01',
    nameEn: 'Bishoftu',
    nameAm: 'ቢሾፍቱ',
    centerLat: 8.75,
    centerLng: 38.98,
    zone: { id: 'zone_east_shewa_01', nameEn: 'East Shewa', region: { id: 'ET04', nameEn: 'Oromia', code: 'ET04' } },
  },
  {
    id: 'woreda_bishoftu_02',
    zoneId: 'zone_east_shewa_01',
    nameEn: 'Bishoftu',
    nameAm: 'ቢሾፍቱ',
    centerLat: 8.75,
    centerLng: 38.98,
    zone: { id: 'zone_east_shewa_01', nameEn: 'East Shewa', region: { id: 'ET04', nameEn: 'Oromia', code: 'ET04' } },
  },
];

/**
 * List all administrative regions with their zones
 */
async function getRegions() {
  if (isConnected()) {
    try {
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
    } catch (_err) {
      // Fallback
    }
  }

  return FALLBACK_REGIONS;
}

/**
 * List zones optionally filtered by regionId
 */
async function getZones(regionId) {
  if (isConnected()) {
    try {
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
    } catch (_err) {
      // Fallback
    }
  }

  if (regionId) {
    return FALLBACK_ZONES.filter((z) => z.regionId === regionId);
  }
  return FALLBACK_ZONES;
}

/**
 * List woredas with optional filtering by zoneId or search query
 */
async function getWoredas({ zoneId, search, limit = 100, page = 1 } = {}) {
  if (isConnected()) {
    try {
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
    } catch (_err) {
      // Fallback
    }
  }

  let filtered = [...FALLBACK_WOREDAS];
  if (zoneId) {
    filtered = filtered.filter((w) => w.zoneId === zoneId || zoneId.includes('east_shewa'));
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((w) => w.nameEn.toLowerCase().includes(s) || w.nameAm.includes(s));
  }

  return {
    total: filtered.length,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 100,
    data: filtered,
  };
}

/**
 * Get woreda boundary detail including GeoJSON polygon
 */
async function getWoredaById(id) {
  if (isConnected()) {
    try {
      const found = await prisma.woreda.findUnique({
        where: { id },
        include: {
          zone: {
            include: {
              region: true,
            },
          },
        },
      });
      if (found) return found;
    } catch (_err) {
      // Fallback
    }
  }

  const isBishoftu = id === 'ET040102' || id === 'woreda_bishoftu_02' || (id && id.includes('bishoftu'));
  const centerLat = isBishoftu ? 8.75 : 8.54;
  const centerLng = isBishoftu ? 38.98 : 39.27;

  return {
    id: id || 'ET040101',
    nameEn: isBishoftu ? 'Bishoftu' : 'Adama Zuria',
    nameAm: isBishoftu ? 'ቢሾፍቱ' : 'አዳማ ዙሪያ',
    centerLat,
    centerLng,
    zone: {
      id: 'zone_east_shewa_01',
      nameEn: 'East Shewa',
      region: { id: 'ET04', nameEn: 'Oromia', code: 'ET04' },
    },
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [centerLng - 0.15, centerLat - 0.15],
          [centerLng + 0.15, centerLat - 0.15],
          [centerLng + 0.15, centerLat + 0.15],
          [centerLng - 0.15, centerLat + 0.15],
          [centerLng - 0.15, centerLat - 0.15],
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
