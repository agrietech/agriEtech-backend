/**
 * @file init_database_schema.js
 * @description Direct PostgreSQL DDL runner for AgriEtech schema.
 * Ensures PostGIS, all Enums, all 14 Tables, Indexes, and Constraints are created.
 */
require('dotenv').config();
const { Pool } = require('pg');

const DDL = `
-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('FARMER', 'DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'RESEARCHER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RoleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RequestableRole" AS ENUM ('DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'RESEARCHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "HazardType" AS ENUM ('DROUGHT', 'FLOOD', 'LOCUST_PEST', 'VEGETATION_STRESS', 'FROST', 'HEAT_STRESS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DeliveryChannel" AS ENUM ('SMS', 'USSD', 'PUSH_NOTIFICATION', 'WEBSOCKET', 'EMAIL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AlertStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISPATCHED', 'DELIVERED', 'FAILED', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Tables
CREATE TABLE IF NOT EXISTS "Region" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "nameEn" TEXT NOT NULL,
    "nameAm" TEXT,
    "geojson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Zone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regionId" TEXT NOT NULL REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "nameEn" TEXT NOT NULL,
    "nameAm" TEXT,
    "geojson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Woreda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zoneId" TEXT NOT NULL REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "nameEn" TEXT NOT NULL,
    "nameAm" TEXT,
    "geojson" JSONB,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phoneNumber" TEXT UNIQUE,
    "email" TEXT UNIQUE,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'FARMER',
    "preferredLang" TEXT NOT NULL DEFAULT 'am',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "verificationToken" TEXT,
    "woredaId" TEXT REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Farm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "woredaId" TEXT NOT NULL REFERENCES "Woreda"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "farmName" TEXT NOT NULL,
    "areaHectares" DOUBLE PRECISION,
    "polygonGeojson" JSONB,
    "spatialBoundary" geometry,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "primaryCrop" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Sensor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "hardwareId" TEXT NOT NULL UNIQUE,
    "sensorType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SensorReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sensorId" TEXT NOT NULL REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "soilMoisture" DOUBLE PRECISION,
    "soilTemp" DOUBLE PRECISION,
    "ambientTemp" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "rainfallMm" DOUBLE PRECISION,
    "batteryLevel" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SatelliteObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "woredaId" TEXT NOT NULL REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "chirpsRainfallMm" DOUBLE PRECISION,
    "nasaPowerTempMax" DOUBLE PRECISION,
    "nasaPowerTempMin" DOUBLE PRECISION,
    "nasaPowerHumidity" DOUBLE PRECISION,
    "nasaPowerSolarMJ" DOUBLE PRECISION,
    "modisNdvi" DOUBLE PRECISION,
    "sentinel2Ndvi" DOUBLE PRECISION,
    "glofasDischarge" DOUBLE PRECISION,
    "soilMoistureSat" DOUBLE PRECISION,
    "locustPresence" BOOLEAN NOT NULL DEFAULT false,
    "locustDensity" DOUBLE PRECISION,
    "ingestionStatus" TEXT DEFAULT 'SUCCESS',
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SatelliteObservation_woredaId_observationDate_source_key" UNIQUE ("woredaId", "observationDate", "source")
);

CREATE TABLE IF NOT EXISTS "RiskAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "woredaId" TEXT NOT NULL REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "hazardType" "HazardType",
    "riskLevel" "RiskLevel",
    "riskScore" DOUBLE PRECISION,
    "droughtScore" DOUBLE PRECISION,
    "floodScore" DOUBLE PRECISION,
    "locustScore" DOUBLE PRECISION,
    "vegetationScore" DOUBLE PRECISION,
    "compositeScore" DOUBLE PRECISION,
    "alertLevel" TEXT,
    "spi30Day" DOUBLE PRECISION,
    "spi90Day" DOUBLE PRECISION,
    "dischargeAnomaly" DOUBLE PRECISION,
    "ndviAnomaly" DOUBLE PRECISION,
    "locustRiskRadius" DOUBLE PRECISION,
    "recommendationsEn" TEXT,
    "recommendationsAm" TEXT,
    "assessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "woredaId" TEXT NOT NULL REFERENCES "Woreda"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "hazardType" "HazardType" NOT NULL,
    "severity" "RiskLevel" NOT NULL,
    "headline" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "titleEn" TEXT NOT NULL,
    "titleAm" TEXT NOT NULL DEFAULT '',
    "titleOm" TEXT,
    "messageEn" TEXT NOT NULL,
    "messageAm" TEXT NOT NULL DEFAULT '',
    "messageOm" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AlertDeliveryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertId" TEXT NOT NULL REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "channel" "DeliveryChannel" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'DRAFT',
    "responsePayload" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "DiseaseDiagnosis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "imageUrl" TEXT NOT NULL,
    "cropType" TEXT,
    "cropIdentified" TEXT,
    "diseaseName" TEXT,
    "pathogen" TEXT,
    "severity" TEXT DEFAULT 'MODERATE',
    "confidenceScore" DOUBLE PRECISION,
    "symptomsEn" TEXT,
    "symptomsAm" TEXT,
    "treatmentEn" TEXT,
    "treatmentAm" TEXT,
    "treatmentOm" TEXT,
    "preventionEn" TEXT,
    "preventionAm" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "adminId" TEXT,
    "adminEmail" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RoleRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userName" TEXT NOT NULL,
    "userPhone" TEXT,
    "userEmail" TEXT,
    "currentRole" "Role" NOT NULL DEFAULT 'FARMER',
    "requestedRole" "Role" NOT NULL,
    "regionId" TEXT NOT NULL,
    "regionName" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "zoneName" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "woredaName" TEXT NOT NULL,
    "kebeleName" TEXT,
    "staffIdNumber" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "status" "RoleRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS "User_phoneNumber_idx" ON "User"("phoneNumber");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_woredaId_idx" ON "User"("woredaId");

CREATE INDEX IF NOT EXISTS "Zone_regionId_idx" ON "Zone"("regionId");
CREATE INDEX IF NOT EXISTS "Woreda_zoneId_idx" ON "Woreda"("zoneId");
CREATE INDEX IF NOT EXISTS "Woreda_centerLat_centerLng_idx" ON "Woreda"("centerLat", "centerLng");

CREATE INDEX IF NOT EXISTS "Farm_userId_idx" ON "Farm"("userId");
CREATE INDEX IF NOT EXISTS "Farm_woredaId_idx" ON "Farm"("woredaId");
CREATE INDEX IF NOT EXISTS "Farm_latitude_longitude_idx" ON "Farm"("latitude", "longitude");

CREATE INDEX IF NOT EXISTS "Sensor_farmId_idx" ON "Sensor"("farmId");
CREATE INDEX IF NOT EXISTS "Sensor_hardwareId_idx" ON "Sensor"("hardwareId");
CREATE INDEX IF NOT EXISTS "SensorReading_sensorId_recordedAt_idx" ON "SensorReading"("sensorId", "recordedAt");

CREATE INDEX IF NOT EXISTS "SatelliteObservation_woredaId_observationDate_idx" ON "SatelliteObservation"("woredaId", "observationDate");
CREATE INDEX IF NOT EXISTS "SatelliteObservation_source_idx" ON "SatelliteObservation"("source");

CREATE INDEX IF NOT EXISTS "RiskAssessment_woredaId_assessmentDate_idx" ON "RiskAssessment"("woredaId", "assessmentDate");
CREATE INDEX IF NOT EXISTS "RiskAssessment_hazardType_riskLevel_idx" ON "RiskAssessment"("hazardType", "riskLevel");
CREATE INDEX IF NOT EXISTS "RiskAssessment_alertLevel_idx" ON "RiskAssessment"("alertLevel");

CREATE INDEX IF NOT EXISTS "Alert_woredaId_severity_idx" ON "Alert"("woredaId", "severity");
CREATE INDEX IF NOT EXISTS "Alert_status_idx" ON "Alert"("status");

CREATE INDEX IF NOT EXISTS "AlertDeliveryLog_alertId_idx" ON "AlertDeliveryLog"("alertId");
CREATE INDEX IF NOT EXISTS "AlertDeliveryLog_userId_idx" ON "AlertDeliveryLog"("userId");

CREATE INDEX IF NOT EXISTS "DiseaseDiagnosis_farmId_idx" ON "DiseaseDiagnosis"("farmId");

CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_adminId_idx" ON "AuditLog"("adminId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE INDEX IF NOT EXISTS "RoleRequest_userId_idx" ON "RoleRequest"("userId");
CREATE INDEX IF NOT EXISTS "RoleRequest_status_idx" ON "RoleRequest"("status");
CREATE INDEX IF NOT EXISTS "RoleRequest_woredaId_idx" ON "RoleRequest"("woredaId");
CREATE INDEX IF NOT EXISTS "RoleRequest_requestedRole_idx" ON "RoleRequest"("requestedRole");
CREATE INDEX IF NOT EXISTS "RoleRequest_createdAt_idx" ON "RoleRequest"("createdAt");
`;

async function main() {
  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Executing complete DDL migration...');
    await pool.query(DDL);
    console.log('✅ All 14 tables, enums, postgis extension, and indexes created successfully!');

    // Query tables list
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log(`\nFound ${res.rows.length} tables in public schema:`);
    res.rows.forEach((r, idx) => console.log(`  ${idx + 1}. ${r.table_name}`));
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
