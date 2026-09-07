const { prisma } = require('../../config/db');
const redis = require('../../config/redis');
const { NotFoundError } = require('../../utils/errors');

/**
 * Boundaries Service
 * Sourced directly from OCHA HDX official boundary dataset.
 * 15 Regions -> 107 Zones -> 1,148 Woredas -> Kebeles.
 */

const BOUNDARY_CACHE_TTL = 3600; // 1 hour

async function getRegions(includeGeometry = false) {
  const cacheKey = `boundaries:regions:${includeGeometry ? 'geom' : 'nogeom'}`;
  try {
    if (redis && redis.isConnected && redis.isConnected()) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }
  } catch (_e) { /* non-fatal cache error */ }

  const regions = await prisma.region.findMany({
    orderBy: { nameEn: 'asc' },
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAm: true,
      geojson: includeGeometry ? true : false,
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

  try {
    if (redis && redis.isConnected && redis.isConnected() && regions.length > 0) {
      await redis.set(cacheKey, JSON.stringify(regions), 'EX', BOUNDARY_CACHE_TTL);
    }
  } catch (_e) { /* non-fatal */ }

  return regions;
}

async function getZones(regionId = null) {
  const where = regionId ? { regionId } : {};
  return await prisma.zone.findMany({
    where,
    orderBy: { nameEn: 'asc' },
    include: {
      region: {
        select: { id: true, nameEn: true, nameAm: true, code: true },
      },
    },
  });
}

async function getWoredas({ zoneId = null, regionId = null, search = null, limit = 100, offset = 0 } = {}) {
  const where = {};
  if (zoneId) where.zoneId = zoneId;
  if (regionId) where.zone = { regionId };
  if (search && search.trim()) {
    where.OR = [
      { nameEn: { contains: search.trim(), mode: 'insensitive' } },
      { nameAm: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  const [woredas, total] = await Promise.all([
    prisma.woreda.findMany({
      where,
      orderBy: { nameEn: 'asc' },
      take: Number(limit) || 100,
      skip: Number(offset) || 0,
      select: {
        id: true,
        nameEn: true,
        nameAm: true,
        zoneId: true,
        centerLat: true,
        centerLng: true,
        zone: {
          select: {
            id: true,
            nameEn: true,
            nameAm: true,
            region: {
              select: { id: true, nameEn: true, nameAm: true, code: true },
            },
          },
        },
      },
    }),
    prisma.woreda.count({ where }),
  ]);

  return { woredas, total, limit: Number(limit), offset: Number(offset) };
}

async function getWoredaById(id) {
  const found = await prisma.woreda.findUnique({
    where: { id },
    include: {
      zone: {
        include: {
          region: true,
        },
      },
      kebeles: {
        select: {
          id: true,
          nameEn: true,
          nameAm: true,
          nameOm: true,
          agroZone: true,
          elevationMeters: true,
          centerLat: true,
          centerLng: true,
        },
        orderBy: { nameEn: 'asc' },
      },
    },
  });

  if (!found) {
    throw new NotFoundError(`Woreda '${id}' not found`);
  }

  return found;
}

async function getKebeles({ woredaId = null, agroZone = null, search = null, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (woredaId) where.woredaId = woredaId;
  if (agroZone) where.agroZone = agroZone;
  if (search && search.trim()) {
    where.OR = [
      { nameEn: { contains: search.trim(), mode: 'insensitive' } },
      { nameAm: { contains: search.trim(), mode: 'insensitive' } },
      { nameOm: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  const [kebeles, total] = await Promise.all([
    prisma.kebele.findMany({
      where,
      orderBy: { nameEn: 'asc' },
      take: Number(limit) || 50,
      skip: Number(offset) || 0,
      include: {
        woreda: {
          include: {
            zone: {
              include: { region: true },
            },
          },
        },
      },
    }),
    prisma.kebele.count({ where }),
  ]);

  return { kebeles, total, limit: Number(limit), offset: Number(offset) };
}

async function getKebeleById(id) {
  const found = await prisma.kebele.findUnique({
    where: { id },
    include: {
      woreda: {
        include: {
          zone: {
            include: { region: true },
          },
        },
      },
    },
  });

  if (!found) {
    throw new NotFoundError(`Kebele '${id}' not found`);
  }

  return found;
}

async function resolveWoredaByCoords(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return 'ET040101';
  }

  const woredas = await prisma.woreda.findMany({
    select: { id: true, centerLat: true, centerLng: true },
  });

  if (woredas.length === 0) {
    return 'ET040101';
  }

  let bestWoreda = woredas[0];
  let minDistance = Infinity;

  for (const w of woredas) {
    if (w.centerLat !== null && w.centerLng !== null) {
      const dist = Math.pow(w.centerLat - latitude, 2) + Math.pow(w.centerLng - longitude, 2);
      if (dist < minDistance) {
        minDistance = dist;
        bestWoreda = w;
      }
    }
  }

  return bestWoreda.id;
}

async function getWoredaCoordinates(woredaId) {
  if (!woredaId) {
    return { id: 'ET040101', nameEn: 'Adama Zuria', nameAm: 'አዳማ ዙሪያ', lat: 8.54, lng: 39.27 };
  }

  const woreda = await prisma.woreda.findUnique({
    where: { id: woredaId },
    select: { id: true, nameEn: true, nameAm: true, centerLat: true, centerLng: true },
  });

  if (woreda) {
    return {
      id: woreda.id,
      nameEn: woreda.nameEn,
      nameAm: woreda.nameAm || woreda.nameEn,
      lat: woreda.centerLat,
      lng: woreda.centerLng,
    };
  }

  return { id: woredaId, nameEn: woredaId, nameAm: woredaId, lat: 9.0, lng: 39.0 };
}

async function getNationalSummary() {
  const [regionsCount, zonesCount, woredasCount, kebelesCount] = await Promise.all([
    prisma.region.count(),
    prisma.zone.count(),
    prisma.woreda.count(),
    prisma.kebele.count(),
  ]);

  return {
    country: 'Ethiopia',
    countryCode: 'ETH',
    source: 'UN OCHA HDX (Subnational Administrative Boundaries)',
    levels: {
      admin1_regions: regionsCount,
      admin2_zones: zonesCount,
      admin3_woredas: woredasCount,
      admin4_kebeles: kebelesCount,
    },
    totalAdminUnits: regionsCount + zonesCount + woredasCount + kebelesCount,
    lastUpdated: new Date().toISOString(),
  };
}

async function getAdministrativeHierarchy() {
  return await prisma.region.findMany({
    orderBy: { nameEn: 'asc' },
    select: {
      id: true,
      nameEn: true,
      nameAm: true,
      code: true,
      zones: {
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          nameEn: true,
          nameAm: true,
          code: true,
          woredas: {
            orderBy: { nameEn: 'asc' },
            select: {
              id: true,
              nameEn: true,
              nameAm: true,
              code: true,
              centerLat: true,
              centerLng: true,
            },
          },
        },
      },
    },
  });
}

async function resolveKebeleByCoords(lat, lng) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (isNaN(latitude) || isNaN(longitude)) return null;

  const kebele = await prisma.kebele.findFirst({
    select: { id: true },
  });
  return kebele?.id || null;
}

module.exports = {
  getRegions,
  getZones,
  getWoredas,
  getWoredaById,
  getKebeles,
  getKebeleById,
  resolveWoredaByCoords,
  resolveKebeleByCoords,
  getWoredaCoordinates,
  getNationalSummary,
  getAdministrativeHierarchy,
};
