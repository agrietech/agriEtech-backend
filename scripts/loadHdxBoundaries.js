/**
 * @file loadHdxBoundaries.js
 * @description Production importer for Ethiopian Administrative Boundaries (Admin 1 Regions, Admin 2 Zones, Admin 3 Woredas).
 * Parses GeoJSON files from HDX / OCHA and populates PostgreSQL / PostGIS via Prisma.
 * @usage node scripts/loadHdxBoundaries.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Setup connection pool and Prisma client with adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.resolve(__dirname, '../data/boundaries');

// Amharic name mapping for major Ethiopian Regions
const REGION_AMHARIC_NAMES = {
  Tigray: 'ትግራይ',
  Afar: 'አፋር',
  Amhara: 'አማራ',
  Oromia: 'ኦሮሚያ',
  Somali: 'ሶማሌ',
  'Benishangul Gumz': 'ቤኒሻንጉል ጉሙዝ',
  'Southern Nations, Nationalities and Peoples': 'ደቡብ ብሔሮች',
  Gambela: 'ጋምቤላ',
  Harari: 'ሐረሪ',
  'Addis Ababa': 'አዲስ አበባ',
  'Dire Dawa': 'ድሬዳዋ',
  Sidama: 'ሲዳማ',
  'South West Ethiopia': 'ደቡብ ምዕራብ ኢትዮጵያ',
  'Central Ethiopia': 'ማዕከላዊ ኢትዮጵያ',
  'South Ethiopia': 'ደቡብ ኢትዮጵያ',
};

async function loadRegions(admin1Path) {
  console.log('\n--- 1. Importing Admin 1 (Regions) ---');
  if (!fs.existsSync(admin1Path)) {
    console.error(`File not found: ${admin1Path}`);
    return new Map();
  }

  const raw = fs.readFileSync(admin1Path, 'utf8');
  const data = JSON.parse(raw);
  const regionMap = new Map(); // pcode -> Region record

  console.log(`Found ${data.features.length} regions in GeoJSON.`);

  for (const feature of data.features) {
    const props = feature.properties || {};
    const pcode = props.adm1_pcode || `REG_${Date.now()}`;
    const nameEn = props.adm1_name || 'Unknown Region';
    const nameAm = REGION_AMHARIC_NAMES[nameEn] || props.adm1_name1 || null;

    try {
      const region = await prisma.region.upsert({
        where: { code: pcode },
        update: {
          nameEn,
          nameAm,
          geojson: feature.geometry,
        },
        create: {
          id: pcode,
          code: pcode,
          nameEn,
          nameAm,
          geojson: feature.geometry,
        },
      });

      regionMap.set(pcode, region);
      console.log(`  ✓ Region: ${nameEn} (${pcode})`);
    } catch (err) {
      console.error(`  ✗ Error upserting region ${nameEn}:`, err.message);
    }
  }

  return regionMap;
}

async function loadZones(admin2Path, regionMap) {
  console.log('\n--- 2. Importing Admin 2 (Zones) ---');
  if (!fs.existsSync(admin2Path)) {
    console.error(`File not found: ${admin2Path}`);
    return new Map();
  }

  const raw = fs.readFileSync(admin2Path, 'utf8');
  const data = JSON.parse(raw);
  const zoneMap = new Map(); // pcode -> Zone record

  console.log(`Found ${data.features.length} zones in GeoJSON.`);

  for (const feature of data.features) {
    const props = feature.properties || {};
    const zonePcode = props.adm2_pcode || `ZONE_${Date.now()}`;
    const regPcode = props.adm1_pcode;
    const nameEn = props.adm2_name || 'Unknown Zone';
    const nameAm = props.adm2_name1 || null;

    const region = regionMap.get(regPcode);
    if (!region) {
      console.warn(`  ⚠️ Zone "${nameEn}" has unmapped region code: ${regPcode}. Skipping.`);
      continue;
    }

    try {
      const zone = await prisma.zone.upsert({
        where: { id: zonePcode },
        update: {
          regionId: region.id,
          nameEn,
          nameAm,
          geojson: feature.geometry,
        },
        create: {
          id: zonePcode,
          regionId: region.id,
          nameEn,
          nameAm,
          geojson: feature.geometry,
        },
      });

      zoneMap.set(zonePcode, zone);
    } catch (err) {
      console.error(`  ✗ Error upserting zone ${nameEn}:`, err.message);
    }
  }

  console.log(`  ✓ Successfully imported ${zoneMap.size} Zones.`);
  return zoneMap;
}

async function loadWoredas(admin3Path, zoneMap) {
  console.log('\n--- 3. Importing Admin 3 (Woredas) ---');
  if (!fs.existsSync(admin3Path)) {
    console.error(`File not found: ${admin3Path}`);
    return;
  }

  const raw = fs.readFileSync(admin3Path, 'utf8');
  const data = JSON.parse(raw);

  console.log(`Found ${data.features.length} woredas in GeoJSON. Processing centroids and polygons...`);

  let count = 0;
  const batchSize = 50;
  const woredas = [];

  for (const feature of data.features) {
    const props = feature.properties || {};
    const woredaPcode = props.adm3_pcode || `WOR_${Date.now()}_${count}`;
    const zonePcode = props.adm2_pcode;
    const nameEn = props.adm3_name || 'Unknown Woreda';
    const nameAm = props.adm3_name1 || null;

    const zone = zoneMap.get(zonePcode);
    if (!zone) {
      continue;
    }

    // Calculate centroid with turf
    let centerLat = 9.0;
    let centerLng = 39.0;
    try {
      const centroid = turf.centroid(feature);
      centerLng = centroid.geometry.coordinates[0];
      centerLat = centroid.geometry.coordinates[1];
    } catch (_e) {
      // fallback
    }

    woredas.push({
      id: woredaPcode,
      zoneId: zone.id,
      nameEn,
      nameAm,
      centerLat,
      centerLng,
      geojson: feature.geometry,
    });
  }

  console.log(`Upserting ${woredas.length} woredas into database...`);

  for (let i = 0; i < woredas.length; i += batchSize) {
    const batch = woredas.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (w) => {
        try {
          await prisma.woreda.upsert({
            where: { id: w.id },
            update: {
              zoneId: w.zoneId,
              nameEn: w.nameEn,
              nameAm: w.nameAm,
              centerLat: w.centerLat,
              centerLng: w.centerLng,
              geojson: w.geojson,
            },
            create: {
              id: w.id,
              zoneId: w.zoneId,
              nameEn: w.nameEn,
              nameAm: w.nameAm,
              centerLat: w.centerLat,
              centerLng: w.centerLng,
              geojson: w.geojson,
            },
          });
          count++;
        } catch (err) {
          console.error(`  ✗ Error upserting woreda ${w.nameEn}:`, err.message);
        }
      })
    );
    process.stdout.write(`  Progress: ${Math.min(i + batchSize, woredas.length)} / ${woredas.length} woredas\r`);
  }

  console.log(`\n  ✓ Successfully imported ${count} Woredas!`);
}

async function main() {
  console.log('===============================================================');
  console.log('      ETHIOPIAN ADMINISTRATIVE BOUNDARY DATA IMPORTER');
  console.log('===============================================================');

  const admin1File = path.join(DATA_DIR, 'eth_admin1.geojson');
  const admin2File = path.join(DATA_DIR, 'eth_admin2.geojson');
  const admin3File = path.join(DATA_DIR, 'eth_admin3.geojson');

  try {
    const regionMap = await loadRegions(admin1File);
    const zoneMap = await loadZones(admin2File, regionMap);
    await loadWoredas(admin3File, zoneMap);

    console.log('\n===============================================================');
    console.log('🎉 BOUNDARY IMPORT COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');
  } catch (err) {
    console.error('[FATAL] Boundary import error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
