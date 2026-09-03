/**
 * @file init_database_schema.js
 * @description Production PostgreSQL DDL runner for AgriEtech schema.
 * Creates all Enums, 22 Tables, Foreign Keys, Cascade Rules, and Performance Indexes.
 */
require('dotenv').config();
const { Pool } = require('pg');

const DDL = `
-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('FARMER', 'DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'RESEARCHER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ZONAL_OFFICER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'REGIONAL_OFFICER';

DO $$ BEGIN
    CREATE TYPE "RoleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RequestableRole" AS ENUM ('DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'RESEARCHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "AgroZone" AS ENUM ('WURCH', 'DEGA', 'WEINA_DEGA', 'KOLLA', 'BEREHA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "CropCategory" AS ENUM ('CEREAL', 'PULSE', 'OILSEED', 'CASH_CROP', 'VEGETABLE', 'FRUIT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "HazardType" AS ENUM ('DROUGHT', 'FLOOD', 'LOCUST_PEST', 'VEGETATION_STRESS', 'FROST', 'HEAT_STRESS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "DeliveryChannel" AS ENUM ('SMS', 'USSD', 'PUSH_NOTIFICATION', 'WEBSOCKET', 'EMAIL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "AlertStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISPATCHED', 'DELIVERED', 'FAILED', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Geographic Hierarchy Tables
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

CREATE TABLE IF NOT EXISTS "Kebele" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "woredaId" TEXT NOT NULL REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "nameEn" TEXT NOT NULL,
    "nameAm" TEXT,
    "nameOm" TEXT,
    "pcode" TEXT UNIQUE,
    "elevationMeters" DOUBLE PRECISION,
    "agroZone" "AgroZone" DEFAULT 'WEINA_DEGA',
    "dominantSoilType" TEXT,
    "soilPh" DOUBLE PRECISION,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "geojson" JSONB,
    "ftcName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crops Table
CREATE TABLE IF NOT EXISTS "Crop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "nameEn" TEXT NOT NULL,
    "nameAm" TEXT NOT NULL,
    "nameOm" TEXT,
    "category" "CropCategory" NOT NULL DEFAULT 'CEREAL',
    "growingPeriodDays" INTEGER,
    "waterRequirementMm" DOUBLE PRECISION,
    "optimalSoilPhMin" DOUBLE PRECISION,
    "optimalSoilPhMax" DOUBLE PRECISION,
    "optimalTempMin" DOUBLE PRECISION,
    "optimalTempMax" DOUBLE PRECISION,
    "optimalElevationMin" DOUBLE PRECISION,
    "optimalElevationMax" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Table
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
    "regionId" TEXT REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "zoneId" TEXT REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "woredaId" TEXT REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "kebeleId" TEXT REFERENCES "Kebele"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "kebeleName" TEXT,
    "deviceToken" TEXT,
    "fcmToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Farm & Sensors Tables
CREATE TABLE IF NOT EXISTS "Farm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "woredaId" TEXT NOT NULL REFERENCES "Woreda"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "kebeleId" TEXT REFERENCES "Kebele"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "farmName" TEXT NOT NULL,
    "areaHectares" DOUBLE PRECISION,
    "polygonGeojson" JSONB,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "primaryCrop" TEXT,
    "cropId" TEXT REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "soilType" TEXT,
    "irrigationType" TEXT,
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

-- 6. Earth Observation & Satellite Timeseries
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
    "soilClayPercent" DOUBLE PRECISION,
    "soilSandPercent" DOUBLE PRECISION,
    "soilSiltPercent" DOUBLE PRECISION,
    "soilOrganicCarbon" DOUBLE PRECISION,
    "soilPh" DOUBLE PRECISION,
    "locustPresence" BOOLEAN NOT NULL DEFAULT false,
    "locustDensity" DOUBLE PRECISION,
    "ingestionStatus" TEXT DEFAULT 'SUCCESS',
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SatelliteObservation_woredaId_observationDate_source_key" UNIQUE ("woredaId", "observationDate", "source")
);

-- 7. Risk Assessments, Alerts, Advisories
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
    "woredaId" TEXT NOT NULL REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE,
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
    "priority" INTEGER NOT NULL DEFAULT 1,
    "actionItems" JSONB,
    "expiresAt" TIMESTAMP(3),
    "targetPhones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "affectedAreaKm2" DOUBLE PRECISION,
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

CREATE TABLE IF NOT EXISTS "Advisory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertId" TEXT REFERENCES "Alert"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "woredaId" TEXT NOT NULL REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "cropType" TEXT,
    "hazardType" "HazardType" NOT NULL,
    "severity" "RiskLevel" NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAm" TEXT NOT NULL,
    "titleOm" TEXT,
    "adviceEn" TEXT NOT NULL,
    "adviceAm" TEXT NOT NULL,
    "adviceOm" TEXT,
    "actionItems" JSONB,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. AI Insights, Disease Diagnosis, Notifications, USSD, Subscriptions, Audit
CREATE TABLE IF NOT EXISTS "AIInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
    "feature" TEXT NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "farmId" TEXT REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE,
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

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "titleEn" TEXT NOT NULL,
    "titleAm" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL,
    "bodyAm" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'ALERT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "UssdSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL UNIQUE,
    "phoneNumber" TEXT NOT NULL,
    "serviceCode" TEXT DEFAULT '*212#',
    "text" TEXT,
    "currentStep" TEXT NOT NULL DEFAULT 'HOME',
    "sessionData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'am',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AlertSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "phoneNumber" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "hazardTypes" "HazardType"[] NOT NULL,
    "channel" "DeliveryChannel" NOT NULL DEFAULT 'SMS',
    "preferredLang" TEXT NOT NULL DEFAULT 'am',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE IF NOT EXISTS "DataSourceSyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsIngested" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Comprehensive Indexes
CREATE INDEX IF NOT EXISTS "User_phoneNumber_idx" ON "User"("phoneNumber");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_regionId_idx" ON "User"("regionId");
CREATE INDEX IF NOT EXISTS "User_zoneId_idx" ON "User"("zoneId");
CREATE INDEX IF NOT EXISTS "User_woredaId_idx" ON "User"("woredaId");

CREATE INDEX IF NOT EXISTS "Zone_regionId_idx" ON "Zone"("regionId");
CREATE INDEX IF NOT EXISTS "Woreda_zoneId_idx" ON "Woreda"("zoneId");
CREATE INDEX IF NOT EXISTS "Woreda_centerLat_centerLng_idx" ON "Woreda"("centerLat", "centerLng");
CREATE INDEX IF NOT EXISTS "Kebele_woredaId_idx" ON "Kebele"("woredaId");
CREATE INDEX IF NOT EXISTS "Kebele_centerLat_centerLng_idx" ON "Kebele"("centerLat", "centerLng");

CREATE INDEX IF NOT EXISTS "Crop_code_idx" ON "Crop"("code");
CREATE INDEX IF NOT EXISTS "Crop_category_idx" ON "Crop"("category");

CREATE INDEX IF NOT EXISTS "Farm_userId_idx" ON "Farm"("userId");
CREATE INDEX IF NOT EXISTS "Farm_woredaId_idx" ON "Farm"("woredaId");
CREATE INDEX IF NOT EXISTS "Farm_kebeleId_idx" ON "Farm"("kebeleId");
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
CREATE INDEX IF NOT EXISTS "Alert_createdAt_idx" ON "Alert"("createdAt");

CREATE INDEX IF NOT EXISTS "Advisory_woredaId_hazardType_idx" ON "Advisory"("woredaId", "hazardType");
CREATE INDEX IF NOT EXISTS "Advisory_issuedAt_idx" ON "Advisory"("issuedAt");
CREATE INDEX IF NOT EXISTS "Advisory_status_idx" ON "Advisory"("status");

CREATE INDEX IF NOT EXISTS "AIInsight_feature_idx" ON "AIInsight"("feature");
CREATE INDEX IF NOT EXISTS "AIInsight_userId_idx" ON "AIInsight"("userId");
CREATE INDEX IF NOT EXISTS "AIInsight_createdAt_idx" ON "AIInsight"("createdAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE INDEX IF NOT EXISTS "UssdSession_phoneNumber_idx" ON "UssdSession"("phoneNumber");
CREATE INDEX IF NOT EXISTS "UssdSession_sessionId_idx" ON "UssdSession"("sessionId");

CREATE INDEX IF NOT EXISTS "AlertSubscription_woredaId_isActive_idx" ON "AlertSubscription"("woredaId", "isActive");
CREATE INDEX IF NOT EXISTS "AlertSubscription_phoneNumber_idx" ON "AlertSubscription"("phoneNumber");

CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_adminId_idx" ON "AuditLog"("adminId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE INDEX IF NOT EXISTS "RoleRequest_userId_idx" ON "RoleRequest"("userId");
CREATE INDEX IF NOT EXISTS "RoleRequest_status_idx" ON "RoleRequest"("status");
CREATE INDEX IF NOT EXISTS "RoleRequest_woredaId_idx" ON "RoleRequest"("woredaId");
CREATE INDEX IF NOT EXISTS "RoleRequest_requestedRole_idx" ON "RoleRequest"("requestedRole");

CREATE INDEX IF NOT EXISTS "DataSourceSyncLog_source_syncedAt_idx" ON "DataSourceSyncLog"("source", "syncedAt");
CREATE INDEX IF NOT EXISTS "DataSourceSyncLog_status_idx" ON "DataSourceSyncLog"("status");
`;

async function main() {
  console.log('Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Executing complete DDL migration for all 22 entities...');
    await pool.query(DDL);
    console.log('✅ All 22 tables, enums, foreign keys, cascade rules, and indexes created successfully!');

    // Query tables list
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
    );
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
