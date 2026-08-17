-- PostGIS provides the geometry type used by Farm.spatialBoundary. Keeping this
-- in the migration also makes Prisma's shadow database reproduce the schema.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'RESEARCHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HazardType" AS ENUM ('DROUGHT', 'FLOOD', 'LOCUST_PEST', 'VEGETATION_STRESS', 'FROST', 'HEAT_STRESS');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('SMS', 'USSD', 'PUSH_NOTIFICATION', 'WEBSOCKET', 'EMAIL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('DRAFT', 'DISPATCHED', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'FARMER',
    "preferredLang" TEXT NOT NULL DEFAULT 'am',
    "woredaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAm" TEXT,
    "geojson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAm" TEXT,
    "geojson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Woreda" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAm" TEXT,
    "geojson" JSONB,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Woreda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "farmName" TEXT NOT NULL,
    "areaHectares" DOUBLE PRECISION,
    "polygonGeojson" JSONB,
    "spatialBoundary" geometry,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "primaryCrop" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "hardwareId" TEXT NOT NULL,
    "sensorType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "soilMoisture" DOUBLE PRECISION,
    "soilTemp" DOUBLE PRECISION,
    "ambientTemp" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "rainfallMm" DOUBLE PRECISION,
    "batteryLevel" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatelliteObservation" (
    "id" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "chirpsRainfallMm" DOUBLE PRECISION,
    "nasaPowerTempMax" DOUBLE PRECISION,
    "nasaPowerTempMin" DOUBLE PRECISION,
    "modisNdvi" DOUBLE PRECISION,
    "sentinel2Ndvi" DOUBLE PRECISION,
    "glofasDischarge" DOUBLE PRECISION,
    "soilMoistureSat" DOUBLE PRECISION,
    "locustPresence" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SatelliteObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "hazardType" "HazardType" NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "spi30Day" DOUBLE PRECISION,
    "spi90Day" DOUBLE PRECISION,
    "dischargeAnomaly" DOUBLE PRECISION,
    "ndviAnomaly" DOUBLE PRECISION,
    "locustRiskRadius" DOUBLE PRECISION,
    "recommendationsEn" TEXT,
    "recommendationsAm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "hazardType" "HazardType" NOT NULL,
    "severity" "RiskLevel" NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAm" TEXT NOT NULL,
    "messageEn" TEXT NOT NULL,
    "messageAm" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertDeliveryLog" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "DeliveryChannel" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'DRAFT',
    "responsePayload" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiseaseDiagnosis" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "cropIdentified" TEXT,
    "diseaseName" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "treatmentEn" TEXT,
    "treatmentAm" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiseaseDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_woredaId_idx" ON "User"("woredaId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE INDEX "Zone_regionId_idx" ON "Zone"("regionId");

-- CreateIndex
CREATE INDEX "Woreda_zoneId_idx" ON "Woreda"("zoneId");

-- CreateIndex
CREATE INDEX "Woreda_centerLat_centerLng_idx" ON "Woreda"("centerLat", "centerLng");

-- CreateIndex
CREATE INDEX "Farm_userId_idx" ON "Farm"("userId");

-- CreateIndex
CREATE INDEX "Farm_woredaId_idx" ON "Farm"("woredaId");

-- CreateIndex
CREATE INDEX "Farm_latitude_longitude_idx" ON "Farm"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_hardwareId_key" ON "Sensor"("hardwareId");

-- CreateIndex
CREATE INDEX "Sensor_farmId_idx" ON "Sensor"("farmId");

-- CreateIndex
CREATE INDEX "Sensor_hardwareId_idx" ON "Sensor"("hardwareId");

-- CreateIndex
CREATE INDEX "SensorReading_sensorId_recordedAt_idx" ON "SensorReading"("sensorId", "recordedAt");

-- CreateIndex
CREATE INDEX "SatelliteObservation_woredaId_observationDate_idx" ON "SatelliteObservation"("woredaId", "observationDate");

-- CreateIndex
CREATE INDEX "SatelliteObservation_source_idx" ON "SatelliteObservation"("source");

-- CreateIndex
CREATE INDEX "RiskAssessment_woredaId_assessmentDate_idx" ON "RiskAssessment"("woredaId", "assessmentDate");

-- CreateIndex
CREATE INDEX "RiskAssessment_hazardType_riskLevel_idx" ON "RiskAssessment"("hazardType", "riskLevel");

-- CreateIndex
CREATE INDEX "Alert_woredaId_severity_idx" ON "Alert"("woredaId", "severity");

-- CreateIndex
CREATE INDEX "AlertDeliveryLog_alertId_idx" ON "AlertDeliveryLog"("alertId");

-- CreateIndex
CREATE INDEX "AlertDeliveryLog_userId_idx" ON "AlertDeliveryLog"("userId");

-- CreateIndex
CREATE INDEX "DiseaseDiagnosis_farmId_idx" ON "DiseaseDiagnosis"("farmId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Woreda" ADD CONSTRAINT "Woreda_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatelliteObservation" ADD CONSTRAINT "SatelliteObservation_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDeliveryLog" ADD CONSTRAINT "AlertDeliveryLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDeliveryLog" ADD CONSTRAINT "AlertDeliveryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseDiagnosis" ADD CONSTRAINT "DiseaseDiagnosis_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
