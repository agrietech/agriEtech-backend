-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'RESEARCHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestableRole" AS ENUM ('DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'ZONAL_OFFICER', 'REGIONAL_OFFICER', 'RESEARCHER');

-- CreateEnum
CREATE TYPE "AgroZone" AS ENUM ('WURCH', 'DEGA', 'WEINA_DEGA', 'KOLLA', 'BEREHA');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HazardType" AS ENUM ('DROUGHT', 'FLOOD', 'LOCUST_PEST', 'VEGETATION_STRESS', 'FROST', 'HEAT_STRESS');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('SMS', 'USSD', 'PUSH_NOTIFICATION', 'WEBSOCKET', 'EMAIL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISPATCHED', 'DELIVERED', 'FAILED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "CropCategory" AS ENUM ('CEREAL', 'PULSE', 'OILSEED', 'CASH_CROP', 'VEGETABLE', 'FRUIT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'FARMER',
    "preferredLang" TEXT NOT NULL DEFAULT 'am',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "verificationToken" TEXT,
    "regionId" TEXT,
    "zoneId" TEXT,
    "woredaId" TEXT,
    "kebeleId" TEXT,
    "kebeleName" TEXT,
    "deviceToken" TEXT,
    "fcmToken" TEXT,
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
CREATE TABLE "Kebele" (
    "id" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAm" TEXT,
    "nameOm" TEXT,
    "pcode" TEXT,
    "elevationMeters" DOUBLE PRECISION,
    "agroZone" "AgroZone" DEFAULT 'WEINA_DEGA',
    "dominantSoilType" TEXT,
    "soilPh" DOUBLE PRECISION,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "geojson" JSONB,
    "ftcName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kebele_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "kebeleId" TEXT,
    "farmName" TEXT NOT NULL,
    "areaHectares" DOUBLE PRECISION,
    "polygonGeojson" JSONB,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "primaryCrop" TEXT,
    "cropId" TEXT,
    "soilType" TEXT,
    "irrigationType" TEXT,
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
    "secretToken" TEXT,
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

    CONSTRAINT "SatelliteObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
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
    "farmId" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiseaseDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "adminId" TEXT,
    "adminEmail" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSourceSyncLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsIngested" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataSourceSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advisory" (
    "id" TEXT NOT NULL,
    "alertId" TEXT,
    "woredaId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advisory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
    "feature" TEXT NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "userId" TEXT,
    "farmId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAm" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL,
    "bodyAm" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'ALERT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UssdSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "serviceCode" TEXT DEFAULT '*212#',
    "text" TEXT,
    "currentStep" TEXT NOT NULL DEFAULT 'HOME',
    "sessionData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'am',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UssdSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "hazardTypes" "HazardType"[],
    "channel" "DeliveryChannel" NOT NULL DEFAULT 'SMS',
    "preferredLang" TEXT NOT NULL DEFAULT 'am',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_regionId_idx" ON "User"("regionId");

-- CreateIndex
CREATE INDEX "User_zoneId_idx" ON "User"("zoneId");

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
CREATE UNIQUE INDEX "Kebele_pcode_key" ON "Kebele"("pcode");

-- CreateIndex
CREATE INDEX "Kebele_woredaId_idx" ON "Kebele"("woredaId");

-- CreateIndex
CREATE INDEX "Kebele_centerLat_centerLng_idx" ON "Kebele"("centerLat", "centerLng");

-- CreateIndex
CREATE INDEX "Kebele_agroZone_idx" ON "Kebele"("agroZone");

-- CreateIndex
CREATE INDEX "Farm_userId_idx" ON "Farm"("userId");

-- CreateIndex
CREATE INDEX "Farm_woredaId_idx" ON "Farm"("woredaId");

-- CreateIndex
CREATE INDEX "Farm_kebeleId_idx" ON "Farm"("kebeleId");

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
CREATE UNIQUE INDEX "SatelliteObservation_woredaId_observationDate_source_key" ON "SatelliteObservation"("woredaId", "observationDate", "source");

-- CreateIndex
CREATE INDEX "RiskAssessment_woredaId_assessmentDate_idx" ON "RiskAssessment"("woredaId", "assessmentDate");

-- CreateIndex
CREATE INDEX "RiskAssessment_hazardType_riskLevel_idx" ON "RiskAssessment"("hazardType", "riskLevel");

-- CreateIndex
CREATE INDEX "RiskAssessment_alertLevel_idx" ON "RiskAssessment"("alertLevel");

-- CreateIndex
CREATE INDEX "Alert_woredaId_severity_idx" ON "Alert"("woredaId", "severity");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE INDEX "AlertDeliveryLog_alertId_idx" ON "AlertDeliveryLog"("alertId");

-- CreateIndex
CREATE INDEX "AlertDeliveryLog_userId_idx" ON "AlertDeliveryLog"("userId");

-- CreateIndex
CREATE INDEX "DiseaseDiagnosis_farmId_idx" ON "DiseaseDiagnosis"("farmId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "RoleRequest_userId_idx" ON "RoleRequest"("userId");

-- CreateIndex
CREATE INDEX "RoleRequest_status_idx" ON "RoleRequest"("status");

-- CreateIndex
CREATE INDEX "RoleRequest_woredaId_idx" ON "RoleRequest"("woredaId");

-- CreateIndex
CREATE INDEX "RoleRequest_requestedRole_idx" ON "RoleRequest"("requestedRole");

-- CreateIndex
CREATE INDEX "RoleRequest_createdAt_idx" ON "RoleRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Crop_code_key" ON "Crop"("code");

-- CreateIndex
CREATE INDEX "Crop_category_idx" ON "Crop"("category");

-- CreateIndex
CREATE INDEX "Crop_code_idx" ON "Crop"("code");

-- CreateIndex
CREATE INDEX "DataSourceSyncLog_source_syncedAt_idx" ON "DataSourceSyncLog"("source", "syncedAt");

-- CreateIndex
CREATE INDEX "DataSourceSyncLog_status_idx" ON "DataSourceSyncLog"("status");

-- CreateIndex
CREATE INDEX "Advisory_woredaId_hazardType_idx" ON "Advisory"("woredaId", "hazardType");

-- CreateIndex
CREATE INDEX "Advisory_issuedAt_idx" ON "Advisory"("issuedAt");

-- CreateIndex
CREATE INDEX "Advisory_status_idx" ON "Advisory"("status");

-- CreateIndex
CREATE INDEX "AIInsight_feature_idx" ON "AIInsight"("feature");

-- CreateIndex
CREATE INDEX "AIInsight_userId_idx" ON "AIInsight"("userId");

-- CreateIndex
CREATE INDEX "AIInsight_createdAt_idx" ON "AIInsight"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UssdSession_sessionId_key" ON "UssdSession"("sessionId");

-- CreateIndex
CREATE INDEX "UssdSession_phoneNumber_idx" ON "UssdSession"("phoneNumber");

-- CreateIndex
CREATE INDEX "UssdSession_sessionId_idx" ON "UssdSession"("sessionId");

-- CreateIndex
CREATE INDEX "UssdSession_updatedAt_idx" ON "UssdSession"("updatedAt");

-- CreateIndex
CREATE INDEX "AlertSubscription_woredaId_isActive_idx" ON "AlertSubscription"("woredaId", "isActive");

-- CreateIndex
CREATE INDEX "AlertSubscription_phoneNumber_idx" ON "AlertSubscription"("phoneNumber");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_kebeleId_fkey" FOREIGN KEY ("kebeleId") REFERENCES "Kebele"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Woreda" ADD CONSTRAINT "Woreda_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kebele" ADD CONSTRAINT "Kebele_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_kebeleId_fkey" FOREIGN KEY ("kebeleId") REFERENCES "Kebele"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatelliteObservation" ADD CONSTRAINT "SatelliteObservation_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDeliveryLog" ADD CONSTRAINT "AlertDeliveryLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDeliveryLog" ADD CONSTRAINT "AlertDeliveryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseDiagnosis" ADD CONSTRAINT "DiseaseDiagnosis_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleRequest" ADD CONSTRAINT "RoleRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleRequest" ADD CONSTRAINT "RoleRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advisory" ADD CONSTRAINT "Advisory_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advisory" ADD CONSTRAINT "Advisory_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertSubscription" ADD CONSTRAINT "AlertSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertSubscription" ADD CONSTRAINT "AlertSubscription_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

