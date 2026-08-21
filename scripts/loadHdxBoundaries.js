/**
 * @file loadHdxBoundaries.js
 * @description Production bulk importer for Ethiopian Administrative Boundaries (Admin 1 Regions, Admin 2 Zones, Admin 3 Woredas).
 * Parses GeoJSON files from HDX / OCHA and populates PostgreSQL / PostGIS with high-performance bulk operations.
 * @usage node scripts/loadHdxBoundaries.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');
const { Pool } = require('pg');

const DATA_DIR = path.resolve(__dirname, '../data/boundaries');

// Amharic name mapping for Ethiopian Regions
const REGION_AMHARIC_NAMES = {
  Tigray: 'ትግራይ',
  Afar: 'አፋር',
  Amhara: 'አማራ',
  Oromia: 'ኦሮሚያ',
  Somali: 'ሶማሌ',
  'Benishangul-Gumuz': 'ቤኒሻንጉል ጉሙዝ',
  'Benishangul Gumz': 'ቤኒሻንጉል ጉሙዝ',
  'Central Ethiopia': 'ማዕከላዊ ኢትዮጵያ',
  'South Ethiopia': 'ደቡብ ኢትዮጵያ',
  'South West Ethiopia': 'ደቡብ ምዕራብ ኢትዮጵያ',
  'Southern Nations, Nationalities and Peoples': 'ደቡብ ብሔሮች',
  Gambela: 'ጋምቤላ',
  Harari: 'ሐረሪ',
  'Addis Ababa': 'አዲስ አበባ',
  'Dire Dawa': 'ድሬዳዋ',
  Sidama: 'ሲዳማ',
  Contested: 'አከራካሪ አካባቢ',
};

async function loadRegions(client, admin1Path) {
  console.log('\n--- 1. Importing Admin 1 (Regions) ---');
  if (!fs.existsSync(admin1Path)) {
    throw new Error(`File not found: ${admin1Path}`);
  }

  const raw = fs.readFileSync(admin1Path, 'utf8');
  const data = JSON.parse(raw);
  const regionMap = new Map();

  console.log(`Found ${data.features.length} regions in GeoJSON.`);

  for (const feature of data.features) {
    const props = feature.properties || {};
    const pcode = props.adm1_pcode || `REG_${Date.now()}`;
    const nameEn = props.adm1_name || 'Unknown Region';
    const nameAm = REGION_AMHARIC_NAMES[nameEn] || props.adm1_name1 || null;

    const query = `
      INSERT INTO "Region" ("id", "code", "nameEn", "nameAm", "geojson", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "code" = EXCLUDED."code",
        "nameEn" = EXCLUDED."nameEn",
        "nameAm" = EXCLUDED."nameAm",
        "geojson" = EXCLUDED."geojson",
        "updatedAt" = NOW()
      RETURNING *;
    `;

    const res = await client.query(query, [
      pcode,
      pcode,
      nameEn,
      nameAm,
      JSON.stringify(feature.geometry),
    ]);

    regionMap.set(pcode, res.rows[0]);
    console.log(`  ✓ Region: ${nameEn} (${pcode})`);
  }

  console.log(`  ✓ Successfully imported ${regionMap.size} Regions.`);
  return regionMap;
}

async function loadZones(client, admin2Path, regionMap) {
  console.log('\n--- 2. Importing Admin 2 (Zones) ---');
  if (!fs.existsSync(admin2Path)) {
    throw new Error(`File not found: ${admin2Path}`);
  }

  const raw = fs.readFileSync(admin2Path, 'utf8');
  const data = JSON.parse(raw);
  const zoneMap = new Map();

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

    const query = `
      INSERT INTO "Zone" ("id", "regionId", "nameEn", "nameAm", "geojson", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "regionId" = EXCLUDED."regionId",
        "nameEn" = EXCLUDED."nameEn",
        "nameAm" = EXCLUDED."nameAm",
        "geojson" = EXCLUDED."geojson",
        "updatedAt" = NOW()
      RETURNING *;
    `;

    const res = await client.query(query, [
      zonePcode,
      region.id,
      nameEn,
      nameAm,
      JSON.stringify(feature.geometry),
    ]);

    zoneMap.set(zonePcode, res.rows[0]);
  }

  console.log(`  ✓ Successfully imported ${zoneMap.size} Zones.`);
  return zoneMap;
}

async function loadWoredas(client, admin3Path, zoneMap) {
  console.log('\n--- 3. Importing Admin 3 (Woredas) ---');
  if (!fs.existsSync(admin3Path)) {
    throw new Error(`File not found: ${admin3Path}`);
  }

  const raw = fs.readFileSync(admin3Path, 'utf8');
  const data = JSON.parse(raw);

  console.log(`Found ${data.features.length} woredas in GeoJSON. Calculating centroids and preparing bulk payload...`);

  let count = 0;
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

  console.log(`Executing bulk parameterized upsert for ${woredas.length} woredas...`);

  const batchSize = 100;
  for (let i = 0; i < woredas.length; i += batchSize) {
    const batch = woredas.slice(i, i + batchSize);
    const valuePlaceholders = [];
    const values = [];
    let pIdx = 1;

    for (const w of batch) {
      valuePlaceholders.push(
        `($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6}, NOW())`
      );
      values.push(
        w.id,
        w.zoneId,
        w.nameEn,
        w.nameAm,
        w.centerLat,
        w.centerLng,
        JSON.stringify(w.geojson)
      );
      pIdx += 7;
    }

    const query = `
      INSERT INTO "Woreda" ("id", "zoneId", "nameEn", "nameAm", "centerLat", "centerLng", "geojson", "updatedAt")
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT ("id") DO UPDATE SET
        "zoneId" = EXCLUDED."zoneId",
        "nameEn" = EXCLUDED."nameEn",
        "nameAm" = EXCLUDED."nameAm",
        "centerLat" = EXCLUDED."centerLat",
        "centerLng" = EXCLUDED."centerLng",
        "geojson" = EXCLUDED."geojson",
        "updatedAt" = NOW();
    `;

    await client.query(query, values);
    count += batch.length;
    console.log(`  ✓ Inserted batch ${Math.min(i + batchSize, woredas.length)} / ${woredas.length} woredas`);
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

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 15000,
  });

  const client = await pool.connect();

  try {
    const regionMap = await loadRegions(client, admin1File);
    const zoneMap = await loadZones(client, admin2File, regionMap);
    await loadWoredas(client, admin3File, zoneMap);

    console.log('\n===============================================================');
    console.log('🎉 BOUNDARY IMPORT COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');
  } catch (err) {
    console.error('[FATAL] Boundary import error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
