const { prisma, isConnected } = require('../../config/db');

// Complete Ethiopian Administrative Boundaries (15 Regions)
const FALLBACK_REGIONS = [
  { id: 'ET01', code: 'ET01', nameEn: 'Tigray', nameAm: 'ትግራይ' },
  { id: 'ET02', code: 'ET02', nameEn: 'Afar', nameAm: 'አፋር' },
  { id: 'ET03', code: 'ET03', nameEn: 'Amhara', nameAm: 'አማራ' },
  { id: 'ET04', code: 'ET04', nameEn: 'Oromia', nameAm: 'ኦሮሚያ' },
  { id: 'ET05', code: 'ET05', nameEn: 'Somali', nameAm: 'ሶማሌ' },
  { id: 'ET06', code: 'ET06', nameEn: 'Benishangul-Gumuz', nameAm: 'ቤንሻንጉል ጉሙዝ' },
  { id: 'ET07', code: 'ET07', nameEn: 'SNNPR', nameAm: 'ደቡብ ብሔሮች ብሔረሰቦችና ሕዝቦች' },
  { id: 'ET08', code: 'ET08', nameEn: 'Gambela', nameAm: 'ጋምቤላ' },
  { id: 'ET09', code: 'ET09', nameEn: 'Harari', nameAm: 'ሐረሪ' },
  { id: 'ET10', code: 'ET10', nameEn: 'Sidama', nameAm: 'ሲዳማ' },
  { id: 'ET11', code: 'ET11', nameEn: 'South West Ethiopia', nameAm: 'ደቡብ ምዕራብ ኢትዮጵያ' },
  { id: 'ET12', code: 'ET12', nameEn: 'Central Ethiopia', nameAm: 'ማዕከላዊ ኢትዮጵያ' },
  { id: 'ET13', code: 'ET13', nameEn: 'South Ethiopia', nameAm: 'ደቡብ ኢትዮጵያ' },
  { id: 'ET14', code: 'ET14', nameEn: 'Addis Ababa', nameAm: 'አዲስ አበባ' },
  { id: 'ET15', code: 'ET15', nameEn: 'Dire Dawa', nameAm: 'ድሬዳዋ' },
];

// Comprehensive Zones by Region
const FALLBACK_ZONES = [
  // Tigray Region Zones
  { id: 'zone_tigray_central', nameEn: 'Central Tigray', nameAm: 'ማእከላይ ትግራይ', regionId: 'ET01' },
  { id: 'zone_tigray_eastern', nameEn: 'Eastern Tigray', nameAm: 'ምስራቅ ትግራይ', regionId: 'ET01' },
  { id: 'zone_tigray_northwestern', nameEn: 'Northwestern Tigray', nameAm: 'ሰሜን ምዕራብ ትግራይ', regionId: 'ET01' },
  { id: 'zone_tigray_southern', nameEn: 'Southern Tigray', nameAm: 'ደቡብ ትግራይ', regionId: 'ET01' },
  { id: 'zone_tigray_western', nameEn: 'Western Tigray', nameAm: 'ምዕራብ ትግራይ', regionId: 'ET01' },
  { id: 'zone_tigray_mekelle', nameEn: 'Mekelle Special Zone', nameAm: 'መቐለ ልዩ ዞን', regionId: 'ET01' },

  // Afar Region Zones
  { id: 'zone_afar_zone1', nameEn: 'Zone 1 (Awsi Rasu)', nameAm: 'ዞን 1', regionId: 'ET02' },
  { id: 'zone_afar_zone2', nameEn: 'Zone 2 (Kilbet Rasu)', nameAm: 'ዞን 2', regionId: 'ET02' },
  { id: 'zone_afar_zone3', nameEn: 'Zone 3 (Gabi Rasu)', nameAm: 'ዞን 3', regionId: 'ET02' },
  { id: 'zone_afar_zone4', nameEn: 'Zone 4 (Fantena Rasu)', nameAm: 'ዞን 4', regionId: 'ET02' },
  { id: 'zone_afar_zone5', nameEn: 'Zone 5 (Hari Rasu)', nameAm: 'ዞን 5', regionId: 'ET02' },

  // Amhara Region Zones
  { id: 'zone_amhara_north_shewa', nameEn: 'North Shewa', nameAm: 'ሰሜን ሸዋ', regionId: 'ET03' },
  { id: 'zone_amhara_south_wollo', nameEn: 'South Wollo', nameAm: 'ደቡብ ወሎ', regionId: 'ET03' },
  { id: 'zone_amhara_north_wollo', nameEn: 'North Wollo', nameAm: 'ሰሜን ወሎ', regionId: 'ET03' },
  { id: 'zone_amhara_north_gondar', nameEn: 'North Gondar', nameAm: 'ሰሜን ጎንደር', regionId: 'ET03' },
  { id: 'zone_amhara_south_gondar', nameEn: 'South Gondar', nameAm: 'ደቡብ ጎንደር', regionId: 'ET03' },
  { id: 'zone_amhara_east_gojjam', nameEn: 'East Gojjam', nameAm: 'ምስራቅ ጎጃም', regionId: 'ET03' },
  { id: 'zone_amhara_west_gojjam', nameEn: 'West Gojjam', nameAm: 'ምዕራብ ጎጃም', regionId: 'ET03' },
  { id: 'zone_amhara_awi', nameEn: 'Awi', nameAm: 'አዊ', regionId: 'ET03' },
  { id: 'zone_amhara_wag_hemra', nameEn: 'Wag Hemra', nameAm: 'ዋግ ሕምራ', regionId: 'ET03' },
  { id: 'zone_amhara_oromia', nameEn: 'Oromia (Kemise)', nameAm: 'ኦሮሚያ', regionId: 'ET03' },
  { id: 'zone_amhara_argoba', nameEn: 'Argoba', nameAm: 'አርጎባ', regionId: 'ET03' },

  // Oromia Region Zones
  { id: 'zone_oromia_west_arsi', nameEn: 'West Arsi', nameAm: 'ምዕራብ አርሲ', regionId: 'ET04' },
  { id: 'zone_oromia_arsi', nameEn: 'Arsi', nameAm: 'አርሲ', regionId: 'ET04' },
  { id: 'zone_oromia_east_shewa', nameEn: 'East Shewa', nameAm: 'ምስራቅ ሸዋ', regionId: 'ET04' },
  { id: 'zone_oromia_north_shewa', nameEn: 'North Shewa', nameAm: 'ሰሜን ሸዋ', regionId: 'ET04' },
  { id: 'zone_oromia_west_shewa', nameEn: 'West Shewa', nameAm: 'ምዕራብ ሸዋ', regionId: 'ET04' },
  { id: 'zone_oromia_southwest_shewa', nameEn: 'Southwest Shewa', nameAm: 'ደቡብ ምዕራብ ሸዋ', regionId: 'ET04' },
  { id: 'zone_oromia_bale', nameEn: 'Bale', nameAm: 'ባሌ', regionId: 'ET04' },
  { id: 'zone_oromia_borena', nameEn: 'Borena', nameAm: 'ቦረና', regionId: 'ET04' },
  { id: 'zone_oromia_guji', nameEn: 'Guji', nameAm: 'ጉጂ', regionId: 'ET04' },
  { id: 'zone_oromia_east_hararghe', nameEn: 'East Hararghe', nameAm: 'ምስራቅ ሐረርጌ', regionId: 'ET04' },
  { id: 'zone_oromia_west_hararghe', nameEn: 'West Hararghe', nameAm: 'ምዕራብ ሐረርጌ', regionId: 'ET04' },
  { id: 'zone_oromia_east_wollega', nameEn: 'East Wollega', nameAm: 'ምስራቅ ወለጋ', regionId: 'ET04' },
  { id: 'zone_oromia_west_wollega', nameEn: 'West Wollega', nameAm: 'ምዕራብ ወለጋ', regionId: 'ET04' },
  { id: 'zone_oromia_kellem_wollega', nameEn: 'Kellem Wollega', nameAm: 'ቀለም ወለጋ', regionId: 'ET04' },
  { id: 'zone_oromia_horo_guduru', nameEn: 'Horo Guduru Wollega', nameAm: 'ሆሮ ጉዱሩ ወለጋ', regionId: 'ET04' },
  { id: 'zone_oromia_jimma', nameEn: 'Jimma', nameAm: 'ጅማ', regionId: 'ET04' },
  { id: 'zone_oromia_illubabor', nameEn: 'Illubabor', nameAm: 'ኢሉባቦር', regionId: 'ET04' },
  { id: 'zone_oromia_buno_bedele', nameEn: 'Buno Bedele', nameAm: 'ቡኖ በደሌ', regionId: 'ET04' },

  // Somali Region Zones
  { id: 'zone_somali_afder', nameEn: 'Afder', nameAm: 'አፍድር', regionId: 'ET05' },
  { id: 'zone_somali_dollo', nameEn: 'Dollo', nameAm: 'ዶሎ', regionId: 'ET05' },
  { id: 'zone_somali_fafan', nameEn: 'Fafan', nameAm: 'ፋፋን', regionId: 'ET05' },
  { id: 'zone_somali_jarar', nameEn: 'Jarar', nameAm: 'ጃራር', regionId: 'ET05' },
  { id: 'zone_somali_korahe', nameEn: 'Korahe', nameAm: 'ቆራሄ', regionId: 'ET05' },
  { id: 'zone_somali_nogob', nameEn: 'Nogob', nameAm: 'ኖጎብ', regionId: 'ET05' },
  { id: 'zone_somali_shabelle', nameEn: 'Shabelle', nameAm: 'ሻበለ', regionId: 'ET05' },
  { id: 'zone_somali_siti', nameEn: 'Siti', nameAm: 'ሲቲ', regionId: 'ET05' },

  // Benishangul-Gumuz Zones
  { id: 'zone_benishangul_assosa', nameEn: 'Assosa', nameAm: 'አሶሳ', regionId: 'ET06' },
  { id: 'zone_benishangul_kamashi', nameEn: 'Kamashi', nameAm: 'ካማሺ', regionId: 'ET06' },
  { id: 'zone_benishangul_metekel', nameEn: 'Metekel', nameAm: 'መተከል', regionId: 'ET06' },

  // SNNPR Zones (before reorganization)
  { id: 'zone_snnpr_gurage', nameEn: 'Gurage', nameAm: 'ጉራጌ', regionId: 'ET07' },
  { id: 'zone_snnpr_hadiya', nameEn: 'Hadiya', nameAm: 'ሐዲያ', regionId: 'ET07' },
  { id: 'zone_snnpr_kembata_tembaro', nameEn: 'Kembata Tembaro', nameAm: 'ከምባታ ተምባሮ', regionId: 'ET07' },
  { id: 'zone_snnpr_wolaita', nameEn: 'Wolaita', nameAm: 'ወላይታ', regionId: 'ET07' },
  { id: 'zone_snnpr_dawro', nameEn: 'Dawro', nameAm: 'ዳውሮ', regionId: 'ET07' },
  { id: 'zone_snnpr_gamo', nameEn: 'Gamo', nameAm: 'ጋሞ', regionId: 'ET07' },
  { id: 'zone_snnpr_gofa', nameEn: 'Gofa', nameAm: 'ጎፋ', regionId: 'ET07' },

  // Gambela Zones
  { id: 'zone_gambela_anuak', nameEn: 'Anuak', nameAm: 'አኑዋክ', regionId: 'ET08' },
  { id: 'zone_gambela_nuer', nameEn: 'Nuer', nameAm: 'ኑዌር', regionId: 'ET08' },
  { id: 'zone_gambela_mezhenger', nameEn: 'Mezhenger', nameAm: 'መዥንገር', regionId: 'ET08' },

  // Harari (single zone)
  { id: 'zone_harari_city', nameEn: 'Harari City', nameAm: 'ሐረሪ ከተማ', regionId: 'ET09' },

  // Sidama Zones
  { id: 'zone_sidama_central', nameEn: 'Central Sidama', nameAm: 'ማእከላይ ሲዳማ', regionId: 'ET10' },
  { id: 'zone_sidama_hawassa', nameEn: 'Hawassa City', nameAm: 'ሐዋሳ ከተማ', regionId: 'ET10' },

  // South West Ethiopia Zones
  { id: 'zone_southwest_bench_sheko', nameEn: 'Bench Sheko', nameAm: 'ቤንች ሸኮ', regionId: 'ET11' },
  { id: 'zone_southwest_west_omo', nameEn: 'West Omo', nameAm: 'ምዕራብ ኦሞ', regionId: 'ET11' },
  { id: 'zone_southwest_keffa', nameEn: 'Keffa', nameAm: 'ከፋ', regionId: 'ET11' },
  { id: 'zone_southwest_sheka', nameEn: 'Sheka', nameAm: 'ሸካ', regionId: 'ET11' },

  // Central Ethiopia Zones
  { id: 'zone_central_ethiopia', nameEn: 'Central Ethiopia Zone', nameAm: 'ማዕከላዊ ኢትዮጵያ ዞን', regionId: 'ET12' },

  // South Ethiopia Zones
  { id: 'zone_south_ethiopia', nameEn: 'South Ethiopia Zone', nameAm: 'ደቡብ ኢትዮጵያ ዞን', regionId: 'ET13' },

  // Addis Ababa Sub-cities (as zones)
  { id: 'zone_aa_addis_ketema', nameEn: 'Addis Ketema', nameAm: 'አዲስ ከተማ', regionId: 'ET14' },
  { id: 'zone_aa_akaki_kality', nameEn: 'Akaki Kality', nameAm: 'አቃቂ ቃሊቲ', regionId: 'ET14' },
  { id: 'zone_aa_arada', nameEn: 'Arada', nameAm: 'አራዳ', regionId: 'ET14' },
  { id: 'zone_aa_bole', nameEn: 'Bole', nameAm: 'ቦሌ', regionId: 'ET14' },
  { id: 'zone_aa_gullele', nameEn: 'Gullele', nameAm: 'ጉለሌ', regionId: 'ET14' },
  { id: 'zone_aa_kirkos', nameEn: 'Kirkos', nameAm: 'ኪርኮስ', regionId: 'ET14' },
  { id: 'zone_aa_kolfe_keranio', nameEn: 'Kolfe Keranio', nameAm: 'ቆልፌ ቀራኒዮ', regionId: 'ET14' },
  { id: 'zone_aa_lideta', nameEn: 'Lideta', nameAm: 'ልደታ', regionId: 'ET14' },
  { id: 'zone_aa_nifas_silk_lafto', nameEn: 'Nifas Silk Lafto', nameAm: 'ንፋስ ስልክ ላፍቶ', regionId: 'ET14' },
  { id: 'zone_aa_yeka', nameEn: 'Yeka', nameAm: 'የካ', regionId: 'ET14' },

  // Dire Dawa (single zone)
  { id: 'zone_dire_dawa_city', nameEn: 'Dire Dawa City', nameAm: 'ድሬዳዋ ከተማ', regionId: 'ET15' },
];

// Major Woredas (expanded fallback list)
const FALLBACK_WOREDAS = [
  {
    id: 'ET040101',
    zoneId: 'zone_oromia_east_shewa',
    nameEn: 'Adama Zuria',
    nameAm: 'አዳማ ዙሪያ',
    centerLat: 8.54,
    centerLng: 39.27,
  },
  {
    id: 'ET040102',
    zoneId: 'zone_oromia_east_shewa',
    nameEn: 'Bishoftu',
    nameAm: 'ቢሾፍቱ',
    centerLat: 8.75,
    centerLng: 38.98,
  },
  {
    id: 'ET040103',
    zoneId: 'zone_oromia_east_shewa',
    nameEn: 'Mojo',
    nameAm: 'ሞጆ',
    centerLat: 8.6,
    centerLng: 39.12,
  },
  {
    id: 'ET040104',
    zoneId: 'zone_oromia_east_shewa',
    nameEn: 'Dukem',
    nameAm: 'ዱከም',
    centerLat: 8.8,
    centerLng: 38.9,
  },
];

/**
 * List all administrative regions with their zones
 */
async function getRegions(includeGeometry = false) {
  if (isConnected()) {
    try {
      return await prisma.region.findMany({
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
    } catch (_err) {
      // Fallback
    }
  }

  return FALLBACK_REGIONS;
}

/**
 * List zones optionally filtered by regionId
 */
async function getZones(regionId, includeGeometry = false) {
  if (isConnected()) {
    try {
      const where = regionId ? { regionId } : {};
      return await prisma.zone.findMany({
        where,
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          regionId: true,
          nameEn: true,
          nameAm: true,
          geojson: includeGeometry ? true : false,
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
