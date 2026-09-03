const { prisma, isConnected } = require('../../config/db');
const { BadRequestError, NotFoundError, ServiceUnavailableError } = require('../../utils/errors');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const { FirebaseSensorConnector, normalizeSoilMoisture } = require('../../ingestion/connectors/firebaseSensorConnector');

// Register IoT sensor device
async function registerSensor({ farmId, hardwareId, serialNumber, sensorType, deviceType }) {
  const finalHardwareId = hardwareId || serialNumber;
  const finalSensorType = sensorType || deviceType || 'SOIL_MOISTURE';

  if (!farmId) {
    throw new BadRequestError('farmId is required');
  }
  if (!finalHardwareId) {
    throw new BadRequestError('hardwareId or serialNumber is required');
  }

  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) {
    throw new NotFoundError(`Farm with ID ${farmId} not found`);
  }

  return await prisma.sensor.create({
    data: {
      farmId,
      hardwareId: finalHardwareId,
      sensorType: finalSensorType,
      isActive: true,
    },
  });
}

// Record authentic telemetry readings
async function recordTelemetry({
  sensorId,
  hardwareId,
  farmId,
  soilMoisture,
  soilTemp,
  ambientTemp,
  humidity,
  rainfallMm,
  batteryLevel,
  recordedAt,
}) {
  const timestamp = recordedAt ? new Date(recordedAt) : new Date();
  const normalizedMoisture = normalizeSoilMoisture(soilMoisture);

  let actualSensorId = sensorId;

  if (hardwareId && !sensorId) {
    let sensor = await prisma.sensor.findFirst({
      where: { hardwareId },
    });

    // Auto-provision if sensor hardwareId is new
    if (!sensor) {
      let targetFarmId = farmId;
      if (!targetFarmId) {
        const defaultFarm = await prisma.farm.findFirst();
        targetFarmId = defaultFarm ? defaultFarm.id : null;
      }

      if (targetFarmId) {
        try {
          sensor = await prisma.sensor.create({
            data: {
              farmId: targetFarmId,
              hardwareId,
              sensorType: 'SOIL_MOISTURE',
              isActive: true,
            },
          });
        } catch (createErr) {
          logger.warn(`[SensorService] Auto-provision warning for ${hardwareId}: ${createErr.message}`);
        }
      }
    }

    if (sensor) actualSensorId = sensor.id;
  }

  if (!actualSensorId) {
    throw new BadRequestError('Valid sensorId or registered hardwareId is required to record telemetry');
  }

  return await prisma.sensorReading.create({
    data: {
      sensorId: actualSensorId,
      soilMoisture: normalizedMoisture !== null ? Number(normalizedMoisture) : null,
      soilTemp: soilTemp !== undefined && soilTemp !== null ? Number(soilTemp) : null,
      ambientTemp: ambientTemp !== undefined && ambientTemp !== null ? Number(ambientTemp) : null,
      humidity: humidity !== undefined && humidity !== null ? Number(humidity) : null,
      rainfallMm: rainfallMm !== undefined && rainfallMm !== null ? Number(rainfallMm) : null,
      batteryLevel: batteryLevel !== undefined && batteryLevel !== null ? Number(batteryLevel) : null,
      recordedAt: timestamp,
    },
    include: {
      sensor: {
        select: {
          id: true,
          hardwareId: true,
          sensorType: true,
          farmId: true,
        },
      },
    },
  });
}

// Get sensors by farm
async function getSensorsByFarm(farmId) {
  if (!farmId) return [];
  return await prisma.sensor.findMany({
    where: { farmId },
    include: {
      readings: { take: 10, orderBy: { recordedAt: 'desc' } },
      farm: { select: { id: true, farmName: true, userId: true } },
    },
  });
}

// Get all sensors owned by an individual farmer across all their farms
async function getSensorsByFarmer(userId) {
  if (!userId) {
    throw new BadRequestError('userId is required');
  }

  return await prisma.sensor.findMany({
    where: {
      farm: { userId },
    },
    include: {
      farm: {
        select: {
          id: true,
          farmName: true,
          latitude: true,
          longitude: true,
          primaryCrop: true,
        },
      },
      readings: {
        take: 10,
        orderBy: { recordedAt: 'desc' },
      },
    },
  });
}

// Allow an individual farmer to claim/register a sensor device to their farm
async function claimSensor({ userId, farmId, hardwareId, serialNumber, sensorType = 'SOIL_MOISTURE' }) {
  const hwId = hardwareId || serialNumber;
  if (!hwId) {
    throw new BadRequestError('hardwareId or serialNumber is required');
  }
  if (!farmId) {
    throw new BadRequestError('farmId is required');
  }

  // Verify farmer owns the target farm
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
  });

  if (!farm) {
    throw new NotFoundError(`Farm with ID ${farmId} not found`);
  }

  if (userId && farm.userId !== userId) {
    throw new BadRequestError('You do not have permission to attach sensors to this farm');
  }

  // Check if sensor exists
  const existing = await prisma.sensor.findFirst({
    where: { hardwareId: hwId },
  });

  if (existing) {
    return await prisma.sensor.update({
      where: { id: existing.id },
      data: {
        farmId,
        sensorType: sensorType || existing.sensorType,
        isActive: true,
      },
    });
  }

  // Create new sensor record
  return await prisma.sensor.create({
    data: {
      farmId,
      hardwareId: hwId,
      sensorType,
      isActive: true,
    },
  });
}

/**
 * Ingest or sync telemetry data from Firebase
 */
async function syncFirebaseTelemetry({ firebaseUrl, apiKey, path, hardwareId, farmId } = {}) {
  const url = firebaseUrl || env.FIREBASE_DATABASE_URL || 'https://arduinomoisture-default-rtdb.firebaseio.com';
  const key = apiKey || env.FIREBASE_API_KEY || 'AIzaSyDt0I0HwHRlr1qpBHDh_fLlxmtXx3OqVG0';

  logger.info(`[FirebaseSensorConnector] Initiating sync with Firebase RTDB at ${url}`);

  const connector = new FirebaseSensorConnector({ baseUrl: url, apiKey: key });
  const fetchResult = await connector.fetchTelemetry({
    path,
    firebaseUrl: url,
    apiKey: key,
    defaultHardwareId: hardwareId || 'ARDUINO-MOISTURE-01',
  });

  const readings = [];
  for (const record of fetchResult.readings) {
    try {
      const reading = await recordTelemetry({
        hardwareId: record.hardwareId || hardwareId || 'ARDUINO-MOISTURE-01',
        farmId: record.farmId || farmId,
        soilMoisture: record.soilMoisture,
        soilTemp: record.soilTemp,
        ambientTemp: record.ambientTemp,
        humidity: record.humidity,
        rainfallMm: record.rainfallMm,
        batteryLevel: record.batteryLevel,
        recordedAt: record.recordedAt,
      });
      readings.push(reading);
    } catch (err) {
      logger.warn(`[FirebaseSensorConnector] Failed to insert record: ${err.message}`);
    }
  }

  return {
    success: true,
    message: `Successfully synchronized ${readings.length} telemetry readings from Firebase Realtime Database`,
    count: readings.length,
    endpoint: fetchResult.endpoint,
    readings,
  };
}

/**
 * Ingest real-time stream / webhook push from Firebase or IoT hardware
 */
async function receiveFirebaseStream(data) {
  const {
    hardwareId,
    hardware_id,
    device_id,
    deviceId,
    sensorId,
    sensor_id,
    farmId,
    farm_id,
    soilMoisture,
    moisture,
    soil_moisture,
    soilMoisturePct,
    val,
    value,
    raw,
    analog,
    soilTemp,
    soil_temp,
    soil_temperature,
    ambientTemp,
    temperature,
    temp,
    airTemp,
    air_temp,
    humidity,
    relative_humidity,
    rh,
    rainfallMm,
    rainfall,
    rain,
    batteryLevel,
    battery,
    battery_pct,
    batt,
    timestamp,
    recordedAt,
    time,
  } = data || {};

  const hwId =
    hardwareId ||
    hardware_id ||
    device_id ||
    deviceId ||
    sensorId ||
    sensor_id ||
    'ARDUINO-FIREBASE-STREAM';

  return await recordTelemetry({
    hardwareId: hwId,
    farmId: farmId || farm_id,
    soilMoisture:
      soilMoisture ??
      moisture ??
      soil_moisture ??
      soilMoisturePct ??
      val ??
      value ??
      raw ??
      analog,
    soilTemp: soilTemp ?? soil_temp ?? soil_temperature,
    ambientTemp: ambientTemp ?? temperature ?? temp ?? airTemp ?? air_temp,
    humidity: humidity ?? relative_humidity ?? rh,
    rainfallMm: rainfallMm ?? rainfall ?? rain,
    batteryLevel: batteryLevel ?? battery ?? battery_pct ?? batt,
    recordedAt: timestamp || recordedAt || time,
  });
}

module.exports = {
  registerSensor,
  recordTelemetry,
  getSensorsByFarm,
  getSensorsByFarmer,
  claimSensor,
  syncFirebaseTelemetry,
  receiveFirebaseStream,
};
