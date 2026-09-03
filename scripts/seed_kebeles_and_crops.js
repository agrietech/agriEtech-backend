/**
 * @file seed_kebeles_and_crops.js
 * @description Seeds standard Ethiopian Crops and sample Kebeles connected to real Woredas.
 */
require('dotenv').config();
const { Pool } = require('pg');

const CROPS = [
  {
    code: 'TEFF',
    nameEn: 'Teff',
    nameAm: 'ጤፍ',
    nameOm: 'Xaafii',
    category: 'CEREAL',
    growingPeriodDays: 110,
    waterRequirementMm: 500.0,
    optimalSoilPhMin: 6.0,
    optimalSoilPhMax: 7.5,
    optimalTempMin: 15.0,
    optimalTempMax: 28.0,
    optimalElevationMin: 1700.0,
    optimalElevationMax: 2400.0,
  },
  {
    code: 'WHEAT',
    nameEn: 'Wheat',
    nameAm: 'ስንዴ',
    nameOm: 'Qamadii',
    category: 'CEREAL',
    growingPeriodDays: 125,
    waterRequirementMm: 550.0,
    optimalSoilPhMin: 6.0,
    optimalSoilPhMax: 7.5,
    optimalTempMin: 12.0,
    optimalTempMax: 25.0,
    optimalElevationMin: 1800.0,
    optimalElevationMax: 2800.0,
  },
  {
    code: 'MAIZE',
    nameEn: 'Maize',
    nameAm: 'በቆሎ',
    nameOm: 'Boqqoolloo',
    category: 'CEREAL',
    growingPeriodDays: 140,
    waterRequirementMm: 650.0,
    optimalSoilPhMin: 5.8,
    optimalSoilPhMax: 7.2,
    optimalTempMin: 18.0,
    optimalTempMax: 30.0,
    optimalElevationMin: 1000.0,
    optimalElevationMax: 2200.0,
  },
  {
    code: 'COFFEE',
    nameEn: 'Coffee Arabica',
    nameAm: 'ቡና',
    nameOm: 'Buna',
    category: 'CASH_CROP',
    growingPeriodDays: 270,
    waterRequirementMm: 1700.0,
    optimalSoilPhMin: 5.0,
    optimalSoilPhMax: 6.5,
    optimalTempMin: 15.0,
    optimalTempMax: 24.0,
    optimalElevationMin: 1400.0,
    optimalElevationMax: 2200.0,
  },
  {
    code: 'BARLEY',
    nameEn: 'Barley',
    nameAm: 'ገብስ',
    nameOm: 'Garbuu',
    category: 'CEREAL',
    growingPeriodDays: 105,
    waterRequirementMm: 420.0,
    optimalSoilPhMin: 6.5,
    optimalSoilPhMax: 8.0,
    optimalTempMin: 10.0,
    optimalTempMax: 22.0,
    optimalElevationMin: 2000.0,
    optimalElevationMax: 3500.0,
  },
  {
    code: 'SORGHUM',
    nameEn: 'Sorghum',
    nameAm: 'ማሽላ',
    nameOm: 'Mishingaa',
    category: 'CEREAL',
    growingPeriodDays: 130,
    waterRequirementMm: 480.0,
    optimalSoilPhMin: 5.5,
    optimalSoilPhMax: 8.0,
    optimalTempMin: 20.0,
    optimalTempMax: 35.0,
    optimalElevationMin: 500.0,
    optimalElevationMax: 1900.0,
  },
  {
    code: 'ENSET',
    nameEn: 'Enset',
    nameAm: 'እንሰት',
    nameOm: 'Qochoo',
    category: 'CASH_CROP',
    growingPeriodDays: 1200,
    waterRequirementMm: 1300.0,
    optimalSoilPhMin: 5.6,
    optimalSoilPhMax: 7.3,
    optimalTempMin: 12.0,
    optimalTempMax: 22.0,
    optimalElevationMin: 1600.0,
    optimalElevationMax: 3000.0,
  },
  {
    code: 'CHICKPEA',
    nameEn: 'Chickpea',
    nameAm: 'ሽንብራ',
    nameOm: 'Shumburaa',
    category: 'PULSE',
    growingPeriodDays: 105,
    waterRequirementMm: 380.0,
    optimalSoilPhMin: 6.0,
    optimalSoilPhMax: 8.0,
    optimalTempMin: 15.0,
    optimalTempMax: 26.0,
    optimalElevationMin: 1400.0,
    optimalElevationMax: 2300.0,
  },
  {
    code: 'LENTIL',
    nameEn: 'Lentil',
    nameAm: 'ምስር',
    nameOm: 'Misira',
    category: 'PULSE',
    growingPeriodDays: 95,
    waterRequirementMm: 350.0,
    optimalSoilPhMin: 6.0,
    optimalSoilPhMax: 7.5,
    optimalTempMin: 14.0,
    optimalTempMax: 24.0,
    optimalElevationMin: 1800.0,
    optimalElevationMax: 2800.0,
  },
  {
    code: 'SESAME',
    nameEn: 'Sesame',
    nameAm: 'ሰሊጥ',
    nameOm: 'Salxii',
    category: 'OILSEED',
    growingPeriodDays: 105,
    waterRequirementMm: 420.0,
    optimalSoilPhMin: 5.5,
    optimalSoilPhMax: 7.5,
    optimalTempMin: 22.0,
    optimalTempMax: 35.0,
    optimalElevationMin: 500.0,
    optimalElevationMax: 1300.0,
  },
  {
    code: 'FABA_BEAN',
    nameEn: 'Faba Bean',
    nameAm: 'ባቄላ',
    nameOm: 'Baqela',
    category: 'PULSE',
    growingPeriodDays: 135,
    waterRequirementMm: 520.0,
    optimalSoilPhMin: 6.2,
    optimalSoilPhMax: 7.8,
    optimalTempMin: 12.0,
    optimalTempMax: 22.0,
    optimalElevationMin: 1900.0,
    optimalElevationMax: 3000.0,
  },
];

async function seedCrops(pool) {
  console.log('\n--- Seeding Standard Ethiopian Crops ---');
  for (const crop of CROPS) {
    const query = `
      INSERT INTO "Crop" (
        "id", "code", "nameEn", "nameAm", "nameOm", "category",
        "growingPeriodDays", "waterRequirementMm",
        "optimalSoilPhMin", "optimalSoilPhMax",
        "optimalTempMin", "optimalTempMax",
        "optimalElevationMin", "optimalElevationMax",
        "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6::"CropCategory", $7, $8, $9, $10, $11, $12, $13, $14, NOW()
      )
      ON CONFLICT ("code") DO UPDATE SET
        "nameEn" = EXCLUDED."nameEn",
        "nameAm" = EXCLUDED."nameAm",
        "nameOm" = EXCLUDED."nameOm",
        "category" = EXCLUDED."category",
        "growingPeriodDays" = EXCLUDED."growingPeriodDays",
        "waterRequirementMm" = EXCLUDED."waterRequirementMm",
        "optimalSoilPhMin" = EXCLUDED."optimalSoilPhMin",
        "optimalSoilPhMax" = EXCLUDED."optimalSoilPhMax",
        "optimalTempMin" = EXCLUDED."optimalTempMin",
        "optimalTempMax" = EXCLUDED."optimalTempMax",
        "optimalElevationMin" = EXCLUDED."optimalElevationMin",
        "optimalElevationMax" = EXCLUDED."optimalElevationMax",
        "updatedAt" = NOW();
    `;
    await pool.query(query, [
      `crop_${crop.code.toLowerCase()}`,
      crop.code,
      crop.nameEn,
      crop.nameAm,
      crop.nameOm,
      crop.category,
      crop.growingPeriodDays,
      crop.waterRequirementMm,
      crop.optimalSoilPhMin,
      crop.optimalSoilPhMax,
      crop.optimalTempMin,
      crop.optimalTempMax,
      crop.optimalElevationMin,
      crop.optimalElevationMax,
    ]);
    console.log(`  ✓ Crop: ${crop.nameEn} (${crop.code})`);
  }
  console.log(`  ✓ Successfully seeded ${CROPS.length} Crops.`);
}

async function seedSampleKebeles(pool) {
  console.log('\n--- Seeding Sample Kebeles for Key Woredas ---');
  // Get 10 woredas
  const woredaRes = await pool.query(`SELECT "id", "nameEn", "centerLat", "centerLng" FROM "Woreda" LIMIT 20;`);
  
  let kebeleCount = 0;
  for (const w of woredaRes.rows) {
    const kebeleNames = [
      { en: `${w.nameEn} Kebele 01`, am: 'ቀበሌ 01', om: 'Ganda 01' },
      { en: `${w.nameEn} Kebele 02`, am: 'ቀበሌ 02', om: 'Ganda 02' },
      { en: `${w.nameEn} FTC Center`, am: 'የስልጠና ማዕከል', om: 'Ganda Giddu-galeessa' },
    ];

    for (let i = 0; i < kebeleNames.length; i++) {
      const k = kebeleNames[i];
      const kebeleId = `keb_${w.id.toLowerCase()}_${i + 1}`;
      const latOffset = (i - 1) * 0.02;
      const lngOffset = (i - 1) * 0.02;

      await pool.query(`
        INSERT INTO "Kebele" (
          "id", "woredaId", "nameEn", "nameAm", "nameOm", "pcode",
          "elevationMeters", "agroZone", "dominantSoilType", "soilPh",
          "centerLat", "centerLng", "ftcName", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::"AgroZone", $9, $10, $11, $12, $13, NOW()
        )
        ON CONFLICT ("id") DO UPDATE SET
          "nameEn" = EXCLUDED."nameEn",
          "nameAm" = EXCLUDED."nameAm",
          "nameOm" = EXCLUDED."nameOm",
          "centerLat" = EXCLUDED."centerLat",
          "centerLng" = EXCLUDED."centerLng",
          "updatedAt" = NOW();
      `, [
        kebeleId,
        w.id,
        k.en,
        k.am,
        k.om,
        `P_${w.id}_0${i + 1}`,
        1850.0 + i * 50,
        'WEINA_DEGA',
        'Vertisol / Nitisol',
        6.5 + (i * 0.2),
        w.centerLat + latOffset,
        w.centerLng + lngOffset,
        `${w.nameEn} Farmers Training Center`,
      ]);
      kebeleCount++;
    }
  }
  console.log(`  ✓ Successfully seeded ${kebeleCount} Kebeles across sample Woredas.`);
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await seedCrops(pool);
    await seedSampleKebeles(pool);
    console.log('\n🎉 Crop and Kebele seeding complete!');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
