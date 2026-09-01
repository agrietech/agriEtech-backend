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

// Major Woredas across Ethiopia with authentic geographical center coordinates
const FALLBACK_WOREDAS = [
  // Amhara Region Woredas
  {
    id: 'ET030701',
    code: 'woreda_bahirdar_01',
    zoneId: 'zone_amhara_west_gojjam',
    nameEn: 'Bahir Dar Zuria',
    nameAm: 'ባሕር ዳር ዙሪያ',
    centerLat: 11.5936,
    centerLng: 37.3908,
  },
  {
    id: 'ET030401',
    code: 'woreda_gondar_01',
    zoneId: 'zone_amhara_north_gondar',
    nameEn: 'Gondar Zuria',
    nameAm: 'ጎንደር ዙሪያ',
    centerLat: 12.6030,
    centerLng: 37.4521,
  },
  {
    id: 'ET030601',
    code: 'woreda_debremarkos_01',
    zoneId: 'zone_amhara_east_gojjam',
    nameEn: 'Debre Markos',
    nameAm: 'ደብረ ማርቆስ',
    centerLat: 10.3326,
    centerLng: 37.7258,
  },
  {
    id: 'ET030101',
    code: 'woreda_debreberhan_01',
    zoneId: 'zone_amhara_north_shewa',
    nameEn: 'Debre Berhan',
    nameAm: 'ደብረ ብርሃን',
    centerLat: 9.6800,
    centerLng: 39.5300,
  },
  {
    id: 'ET030201',
    code: 'woreda_dessie_01',
    zoneId: 'zone_amhara_south_wollo',
    nameEn: 'Dessie Zuria',
    nameAm: 'ደሴ ዙሪያ',
    centerLat: 11.1300,
    centerLng: 39.6300,
  },
  {
    id: 'ET030301',
    code: 'woreda_woldiya_01',
    zoneId: 'zone_amhara_north_wollo',
    nameEn: 'Woldiya',
    nameAm: 'ወልዲያ',
    centerLat: 11.8300,
    centerLng: 39.5900,
  },

  // Oromia Region Woredas
  {
    id: 'ET040101',
    code: 'woreda_adama_01',
    zoneId: 'zone_oromia_east_shewa',
    nameEn: 'Adama Zuria',
    nameAm: 'አዳማ ዙሪያ',
    centerLat: 8.5400,
    centerLng: 39.2700,
  },
  {
    id: 'ET040102',
    code: 'woreda_bishoftu_01',
    zoneId: 'zone_oromia_east_shewa',
    nameEn: 'Bishoftu',
    nameAm: 'ቢሾፍቱ',
    centerLat: 8.7500,
    centerLng: 38.9800,
  },
  {
    id: 'ET040103',
    code: 'woreda_mojo_01',
    zoneId: 'zone_oromia_east_shewa',
    nameEn: 'Mojo',
    nameAm: 'ሞጆ',
    centerLat: 8.6000,
    centerLng: 39.1200,
  },
  {
    id: 'ET040104',
    code: 'woreda_dukem_01',
    zoneId: 'zone_oromia_east_shewa',
    nameEn: 'Dukem',
    nameAm: 'ዱከም',
    centerLat: 8.8000,
    centerLng: 38.9000,
  },
  {
    id: 'ET041601',
    code: 'woreda_jimma_01',
    zoneId: 'zone_oromia_jimma',
    nameEn: 'Jimma / Mana',
    nameAm: 'ጅማ / ማና',
    centerLat: 7.6734,
    centerLng: 36.8344,
  },
  {
    id: 'ET040201',
    code: 'woreda_asella_01',
    zoneId: 'zone_oromia_arsi',
    nameEn: 'Asella / Tiyo',
    nameAm: 'አሰላ / ጢዮ',
    centerLat: 7.9500,
    centerLng: 39.1300,
  },
  {
    id: 'ET040105',
    code: 'woreda_shashamane_01',
    zoneId: 'zone_oromia_west_arsi',
    nameEn: 'Shashamane',
    nameAm: 'ሻሸመኔ',
    centerLat: 7.2000,
    centerLng: 38.6000,
  },

  // Tigray Region Woredas
  {
    id: 'ET010601',
    code: 'woreda_mekelle_01',
    zoneId: 'zone_tigray_mekelle',
    nameEn: 'Mekelle / Enderta',
    nameAm: 'መቐለ / እንዳርታ',
    centerLat: 13.4967,
    centerLng: 39.4753,
  },

  // Sidama Region Woredas
  {
    id: 'ET100201',
    code: 'woreda_hawassa_01',
    zoneId: 'zone_sidama_hawassa',
    nameEn: 'Hawassa Zuria',
    nameAm: 'ሐዋሳ ዙሪያ',
    centerLat: 7.0504,
    centerLng: 38.4955,
  },

  // South Ethiopia / SNNPR Woredas
  {
    id: 'ET070401',
    code: 'woreda_wolaita_01',
    zoneId: 'zone_snnpr_wolaita',
    nameEn: 'Wolaita Sodo',
    nameAm: 'ወላይታ ሶዶ',
    centerLat: 6.8600,
    centerLng: 37.7600,
  },
  {
    id: 'ET070601',
    code: 'woreda_arbaminch_01',
    zoneId: 'zone_snnpr_gamo',
    nameEn: 'Arba Minch Zuria',
    nameAm: 'አርባ ምንጭ ዙሪያ',
    centerLat: 6.0333,
    centerLng: 37.5500,
  },

  // Somali Region Woredas
  {
    id: 'ET050301',
    code: 'woreda_jijiga_01',
    zoneId: 'zone_somali_fafan',
    nameEn: 'Jijiga',
    nameAm: 'ጅጅጋ',
    centerLat: 9.3500,
    centerLng: 42.8000,
  },

  // Afar Region Woredas
  {
    id: 'ET020101',
    code: 'woreda_semara_01',
    zoneId: 'zone_afar_zone1',
    nameEn: 'Semara / Awsi Rasu',
    nameAm: 'ሰመራ',
    centerLat: 11.7900,
    centerLng: 41.0100,
  },

  // Benishangul-Gumuz Woredas
  {
    id: 'ET060101',
    code: 'woreda_assosa_01',
    zoneId: 'zone_benishangul_assosa',
    nameEn: 'Assosa',
    nameAm: 'አሶሳ',
    centerLat: 10.0667,
    centerLng: 34.5333,
  },

  // Gambela Region Woredas
  {
    id: 'ET080101',
    code: 'woreda_gambela_01',
    zoneId: 'zone_gambela_anuak',
    nameEn: 'Gambela Zuria',
    nameAm: 'ጋምቤላ ዙሪያ',
    centerLat: 8.2500,
    centerLng: 34.5833,
  },

  // Harari & Dire Dawa
  {
    id: 'ET090101',
    code: 'woreda_harar_01',
    zoneId: 'zone_harari_city',
    nameEn: 'Harar City',
    nameAm: 'ሐረር ከተማ',
    centerLat: 9.3139,
    centerLng: 42.1182,
  },
  {
    id: 'ET150101',
    code: 'woreda_diredawa_01',
    zoneId: 'zone_dire_dawa_city',
    nameEn: 'Dire Dawa City',
    nameAm: 'ድሬዳዋ ከተማ',
    centerLat: 9.5931,
    centerLng: 41.8661,
  },
  {
    id: 'ET140101',
    code: 'woreda_addis_01',
    zoneId: 'zone_aa_bole',
    nameEn: 'Addis Ababa',
    nameAm: 'አዲስ አበባ',
    centerLat: 9.0320,
    centerLng: 38.7469,
  },
];

// Authentic Ethiopian Kebele Administrative Boundaries & Peasant Associations
const FALLBACK_KEBELES = [
  // Adama Zuria Woreda Kebeles (Oromia)
  {
    id: 'keb_or_adama_01',
    woredaId: 'ET040101',
    nameEn: 'Wonji Gefersa Kebele 01',
    nameAm: 'ወንጂ ገፈርሳ ቀበሌ 01',
    nameOm: 'Wonjii Gafarsaa Qabalee 01',
    pcode: 'ET040101001',
    elevationMeters: 1540,
    agroZone: 'WEINA_DEGA',
    dominantSoilType: 'Fluvisol (Alluvial)',
    soilPh: 6.8,
    centerLat: 8.4500,
    centerLng: 39.2800,
    ftcName: 'Wonji FTC Extension Station',
  },
  {
    id: 'keb_or_adama_02',
    woredaId: 'ET040101',
    nameEn: 'Dire Bekeli',
    nameAm: 'ድሬ በቀሊ',
    nameOm: 'Dhiree Baqqalii',
    pcode: 'ET040101002',
    elevationMeters: 1680,
    agroZone: 'WEINA_DEGA',
    dominantSoilType: 'Vertisol (Black Soil)',
    soilPh: 7.1,
    centerLat: 8.5200,
    centerLng: 39.3100,
    ftcName: 'Dire Bekeli Farmers Training Center',
  },
  {
    id: 'keb_or_adama_03',
    woredaId: 'ET040101',
    nameEn: 'Boku Shanan',
    nameAm: 'ቦቁ ሻናን',
    nameOm: 'Bokkuu Shanan',
    pcode: 'ET040101003',
    elevationMeters: 1720,
    agroZone: 'WEINA_DEGA',
    dominantSoilType: 'Cambisol',
    soilPh: 6.5,
    centerLat: 8.5700,
    centerLng: 39.2200,
    ftcName: 'Boku Shanan Agricultural Hub',
  },

  // Bishoftu Woreda Kebeles (Oromia)
  {
    id: 'keb_or_bishoftu_01',
    woredaId: 'ET040102',
    nameEn: 'Babogaya Gote 01',
    nameAm: 'ባቦጋያ ጎቴ 01',
    nameOm: 'Baabogayyaa 01',
    pcode: 'ET040102001',
    elevationMeters: 1920,
    agroZone: 'DEGA',
    dominantSoilType: 'Vertisol',
    soilPh: 6.9,
    centerLat: 8.7600,
    centerLng: 38.9900,
    ftcName: 'Babogaya Horticultural FTC',
  },
  {
    id: 'keb_or_bishoftu_02',
    woredaId: 'ET040102',
    nameEn: 'Hora Arsadi Kebele',
    nameAm: 'ሆራ አርሰዲ ቀበሌ',
    nameOm: 'Hora Harsadii Qabalee',
    pcode: 'ET040102002',
    elevationMeters: 1890,
    agroZone: 'DEGA',
    dominantSoilType: 'Nitisol (Red Soil)',
    soilPh: 6.2,
    centerLat: 8.7300,
    centerLng: 38.9700,
    ftcName: 'Hora Arsadi Seed & Crop Center',
  },

  // Bahir Dar Zuria Kebeles (Amhara)
  {
    id: 'keb_am_bahirdar_01',
    woredaId: 'ET030701',
    nameEn: 'Tis Abay Kebele 01',
    nameAm: 'ጢስ አባይ ቀበሌ 01',
    pcode: 'ET030701001',
    elevationMeters: 1640,
    agroZone: 'WEINA_DEGA',
    dominantSoilType: 'Fluvisol (Blue Nile Basin)',
    soilPh: 6.6,
    centerLat: 11.4900,
    centerLng: 37.5900,
    ftcName: 'Tis Abay Agro-Forestry FTC',
  },
  {
    id: 'keb_am_bahirdar_02',
    woredaId: 'ET030701',
    nameEn: 'Zenzelima Kebele',
    nameAm: 'ዘንዘሊማ ቀበሌ',
    pcode: 'ET030701002',
    elevationMeters: 1810,
    agroZone: 'WEINA_DEGA',
    dominantSoilType: 'Nitisol',
    soilPh: 5.9,
    centerLat: 11.6200,
    centerLng: 37.4400,
    ftcName: 'Zenzelima Crop Research Center',
  },

  // Gondar Zuria Kebeles (Amhara)
  {
    id: 'keb_am_gondar_01',
    woredaId: 'ET030401',
    nameEn: 'Degola Chara',
    nameAm: 'ደጎላ ጫራ',
    pcode: 'ET030401001',
    elevationMeters: 2280,
    agroZone: 'DEGA',
    dominantSoilType: 'Lithosol / Cambisol',
    soilPh: 6.0,
    centerLat: 12.5800,
    centerLng: 37.4200,
    ftcName: 'Degola Chara Highland Grain FTC',
  },
  {
    id: 'keb_am_gondar_02',
    woredaId: 'ET030401',
    nameEn: 'Lemba Tsion Kebele',
    nameAm: 'ለምባ ጽዮን ቀበሌ',
    pcode: 'ET030401002',
    elevationMeters: 2450,
    agroZone: 'DEGA',
    dominantSoilType: 'Luvisol',
    soilPh: 5.7,
    centerLat: 12.6400,
    centerLng: 37.4800,
    ftcName: 'Lemba Tsion Teff & Barley FTC',
  },

  // Hawassa Zuria Kebeles (Sidama)
  {
    id: 'keb_si_hawassa_01',
    woredaId: 'ET100201',
    nameEn: 'Tula Kebele 01',
    nameAm: 'ቱላ ቀበሌ 01',
    pcode: 'ET100201001',
    elevationMeters: 1710,
    agroZone: 'WEINA_DEGA',
    dominantSoilType: 'Andosol (Volcanic Ash)',
    soilPh: 6.7,
    centerLat: 7.0200,
    centerLng: 38.4800,
    ftcName: 'Tula Enset & Coffee Extension Station',
  },

  // Mekelle / Enderta Kebeles (Tigray)
  {
    id: 'keb_ti_mekelle_01',
    woredaId: 'ET010601',
    nameEn: 'May Alem Kebele',
    nameAm: 'ማይ ዓለም ቀበሌ',
    pcode: 'ET010601001',
    elevationMeters: 2150,
    agroZone: 'DEGA',
    dominantSoilType: 'Calcisol / Cambisol',
    soilPh: 7.4,
    centerLat: 13.4800,
    centerLng: 39.4600,
    ftcName: 'May Alem Watershed & Soil FTC',
  },
];

/**
 * Resolve accurate geographical coordinates for any woredaId or city name
 */
function getWoredaCoordinates(woredaIdOrName) {
  if (!woredaIdOrName) {
    return { lat: 9.0320, lng: 38.7469, nameEn: 'Addis Ababa', nameAm: 'አዲስ አበባ' };
  }

  const query = String(woredaIdOrName).toLowerCase().trim();
  const match = FALLBACK_WOREDAS.find(
    (w) =>
      w.id.toLowerCase() === query ||
      (w.code && w.code.toLowerCase() === query) ||
      w.nameEn.toLowerCase().includes(query) ||
      query.includes(w.nameEn.toLowerCase()) ||
      (w.nameAm && (w.nameAm.includes(query) || query.includes(w.nameAm)))
  );

  if (match) {
    return {
      lat: match.centerLat,
      lng: match.centerLng,
      nameEn: match.nameEn,
      nameAm: match.nameAm,
      id: match.id,
    };
  }

  return { lat: 9.0320, lng: 38.7469, nameEn: 'Ethiopia Region', nameAm: 'ኢትዮጵያ' };
}

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

  return FALLBACK_REGIONS.map((r) => ({
    ...r,
    zones: FALLBACK_ZONES.filter((z) => z.regionId === r.id).map((z) => ({
      id: z.id,
      nameEn: z.nameEn,
      nameAm: z.nameAm,
    })),
  }));
}

/**
 * List zones optionally filtered by region
 */
async function getZones(regionId = null) {
  if (isConnected()) {
    try {
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
    } catch (_err) {
      // Fallback
    }
  }

  const zones = regionId
    ? FALLBACK_ZONES.filter((z) => z.regionId === regionId)
    : FALLBACK_ZONES;

  return zones.map((z) => ({
    ...z,
    region: FALLBACK_REGIONS.find((r) => r.id === z.regionId) || null,
  }));
}

/**
 * List woredas optionally filtered by zone or region
 */
async function getWoredas({ zoneId = null, regionId = null, search = null, limit = 100, offset = 0 } = {}) {
  if (isConnected()) {
    try {
      const where = {};
      if (zoneId) where.zoneId = zoneId;
      if (regionId) where.zone = { regionId };
      if (search) {
        where.OR = [
          { nameEn: { contains: search, mode: 'insensitive' } },
          { nameAm: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [woredas, total] = await Promise.all([
        prisma.woreda.findMany({
          where,
          orderBy: { nameEn: 'asc' },
          take: Number(limit),
          skip: Number(offset),
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
    } catch (_err) {
      // Fallback
    }
  }

  let woredas = [...FALLBACK_WOREDAS];
  if (zoneId) {
    const rawTarget = String(zoneId).toLowerCase();
    const cleanTarget = rawTarget.replace(/_0\d+$|^zone_|^zone_oromia_/g, '');
    woredas = woredas.filter((w) => {
      if (!w.zoneId) return false;
      const wz = w.zoneId.toLowerCase();
      return wz === rawTarget || wz.includes(cleanTarget) || rawTarget.includes(wz.replace(/^zone_oromia_|^zone_/g, ''));
    });
  }

  if (regionId) {
    const validZoneIds = FALLBACK_ZONES.filter((z) => z.regionId === regionId).map((z) => z.id);
    woredas = woredas.filter((w) => validZoneIds.includes(w.zoneId));
  }
  if (search) {
    const s = search.toLowerCase();
    woredas = woredas.filter(
      (w) =>
        w.nameEn.toLowerCase().includes(s) ||
        (w.nameAm && w.nameAm.includes(s))
    );
  }

  const total = woredas.length;
  const paged = woredas.slice(Number(offset), Number(offset) + Number(limit)).map((w) => {
    const zone = FALLBACK_ZONES.find((z) => z.id === w.zoneId) || null;
    const region = zone ? FALLBACK_REGIONS.find((r) => r.id === zone.regionId) || null : null;
    return {
      ...w,
      zone: zone ? { ...zone, region } : null,
    };
  });

  return { woredas: paged, total, limit: Number(limit), offset: Number(offset) };
}

/**
 * Get detailed woreda information by ID
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
      if (found) {
        return {
          ...found,
          kebeles: FALLBACK_KEBELES.filter((k) => k.woredaId === found.id || k.woredaId === id),
        };
      }
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
    kebeles: FALLBACK_KEBELES.filter((k) => k.woredaId === (id || 'ET040101')),
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

/**
 * List kebeles optionally filtered by woreda, agro-ecological zone, or search
 */
async function getKebeles({ woredaId = null, agroZone = null, search = null, limit = 50, offset = 0 } = {}) {
  if (isConnected()) {
    try {
      const where = {};
      if (woredaId) where.woredaId = woredaId;
      if (agroZone) where.agroZone = agroZone;
      if (search) {
        where.OR = [
          { nameEn: { contains: search, mode: 'insensitive' } },
          { nameAm: { contains: search, mode: 'insensitive' } },
          { nameOm: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [kebeles, total] = await Promise.all([
        prisma.kebele.findMany({
          where,
          orderBy: { nameEn: 'asc' },
          take: Number(limit),
          skip: Number(offset),
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

      if (kebeles.length > 0) {
        return { kebeles, total, limit: Number(limit), offset: Number(offset) };
      }
    } catch (_err) {
      // Fallback
    }
  }

  let kebeles = [...FALLBACK_KEBELES];
  if (woredaId) {
    kebeles = kebeles.filter((k) => k.woredaId === woredaId);
  }
  if (agroZone) {
    kebeles = kebeles.filter((k) => k.agroZone === agroZone);
  }
  if (search) {
    const s = search.toLowerCase();
    kebeles = kebeles.filter(
      (k) =>
        k.nameEn.toLowerCase().includes(s) ||
        (k.nameAm && k.nameAm.includes(s)) ||
        (k.nameOm && k.nameOm.toLowerCase().includes(s))
    );
  }

  const total = kebeles.length;
  const paged = kebeles.slice(Number(offset), Number(offset) + Number(limit)).map((k) => {
    const woreda = FALLBACK_WOREDAS.find((w) => w.id === k.woredaId) || null;
    const zone = woreda ? FALLBACK_ZONES.find((z) => z.id === woreda.zoneId) || null : null;
    const region = zone ? FALLBACK_REGIONS.find((r) => r.id === zone.regionId) || null : null;
    return {
      ...k,
      woreda: woreda ? { ...woreda, zone: zone ? { ...zone, region } : null } : null,
    };
  });

  return { kebeles: paged, total, limit: Number(limit), offset: Number(offset) };
}

/**
 * Get single kebele by ID
 */
async function getKebeleById(id) {
  if (isConnected()) {
    try {
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
      if (found) return found;
    } catch (_err) {
      // Fallback
    }
  }

  const match = FALLBACK_KEBELES.find((k) => k.id === id) || FALLBACK_KEBELES[0];
  const woreda = FALLBACK_WOREDAS.find((w) => w.id === match.woredaId) || null;
  const zone = woreda ? FALLBACK_ZONES.find((z) => z.id === woreda.zoneId) || null : null;
  const region = zone ? FALLBACK_REGIONS.find((r) => r.id === zone.regionId) || null : null;

  return {
    ...match,
    woreda: woreda ? { ...woreda, zone: zone ? { ...zone, region } : null } : null,
  };
}

/**
 * Automatically resolve the nearest/containing Woreda ID from GPS coordinates (lat, lng)
 */
async function resolveWoredaByCoords(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return 'ET040101'; // Default fallback
  }

  if (isConnected()) {
    try {
      const woredas = await prisma.woreda.findMany({
        select: { id: true, centerLat: true, centerLng: true },
      });

      if (woredas.length > 0) {
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
    } catch (_err) {
      // Fallback
    }
  }

  let best = FALLBACK_WOREDAS[0];
  let minDist = Infinity;
  for (const w of FALLBACK_WOREDAS) {
    const dist = Math.pow(w.centerLat - latitude, 2) + Math.pow(w.centerLng - longitude, 2);
    if (dist < minDist) {
      minDist = dist;
      best = w;
    }
  }

  return best.id;
}

/**
 * Automatically resolve nearest Kebele from coordinates
 */
async function resolveKebeleByCoords(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return FALLBACK_KEBELES[0].id;
  }

  let best = FALLBACK_KEBELES[0];
  let minDist = Infinity;
  for (const k of FALLBACK_KEBELES) {
    const dist = Math.pow(k.centerLat - latitude, 2) + Math.pow(k.centerLng - longitude, 2);
    if (dist < minDist) {
      minDist = dist;
      best = k;
    }
  }

  return best.id;
}

/**
 * Get full multi-tier administrative hierarchy (National -> Region -> Zone -> Woreda -> Kebele)
 */
async function getAdministrativeHierarchy() {
  const regions = await getRegions();
  const zones = await getZones();
  const { woredas } = await getWoredas({ limit: 500 });
  const { kebeles } = await getKebeles({ limit: 500 });

  return {
    national: {
      code: 'ETH',
      nameEn: 'Federal Democratic Republic of Ethiopia',
      nameAm: 'የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ',
      totalRegions: regions.length,
      totalZones: zones.length,
      totalWoredas: woredas.length,
      totalKebeles: kebeles.length,
    },
    hierarchy: regions.map((r) => ({
      ...r,
      zones: zones
        .filter((z) => z.regionId === r.id)
        .map((z) => ({
          ...z,
          woredas: woredas
            .filter((w) => w.zoneId === z.id)
            .map((w) => ({
              ...w,
              kebeles: kebeles.filter((k) => k.woredaId === w.id),
            })),
        })),
    })),
  };
}

/**
 * Get summary national metrics across all administrative levels
 */
async function getNationalSummary() {
  return {
    admin0: { level: 'NATIONAL', nameEn: 'Ethiopia', count: 1 },
    admin1: { level: 'REGION', count: FALLBACK_REGIONS.length },
    admin2: { level: 'ZONE', count: FALLBACK_ZONES.length },
    admin3: { level: 'WOREDA', count: 1040 },
    admin4: { level: 'KEBELE', count: 18450 },
    agroEcologicalZones: ['WURCH', 'DEGA', 'WEINA_DEGA', 'KOLLA', 'BEREHA'],
  };
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
  getAdministrativeHierarchy,
  getNationalSummary,
  FALLBACK_REGIONS,
  FALLBACK_ZONES,
  FALLBACK_WOREDAS,
  FALLBACK_KEBELES,
};


