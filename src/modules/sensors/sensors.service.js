const { prisma, isConnected } = require('../../config/db');
const { BadRequestError, NotFoundError } = require('../../utils/errors');

const mockSensors = new Map([
  [
    'sensor_demo_01',
    {
      id: 'sensor_demo_01',
      farmId: 'farm_demo_01',
      hardwareId: 'AGRI-NODE-ETH-099',
      sensorType: 'SOIL_MOISTURE',
      isActive: true,
      createdAt: new Date().toISOString(),
      readings: [],
    },
  ],
]);

const mockReadings = [];

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

  if (isConnected()) {
    // Verify farm exists
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

  const newSensor = {
    id: `sensor_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    farmId,
    hardwareId: finalHardwareId,
    sensorType: finalSensorType,
    isActive: true,
    createdAt: new Date().toISOString(),
    readings: [],
  };

  mockSensors.set(newSensor.id, newSensor);
  mockSensors.set(finalHardwareId, newSensor);
  return newSensor;
}

// Record telemetry readings
async function recordTelemetry({
  sensorId,
  hardwareId,
  soilMoisture,
  soilTemp,
  ambientTemp,
  humidity,
  rainfallMm,
  batteryLevel,
  recordedAt,
}) {
  const timestamp = recordedAt ? new Date(recordedAt) : new Date();

  if (isConnected()) {
    let actualSensorId = sensorId;
    if (hardwareId && !sensorId) {
      const sensor = await prisma.sensor.findFirst({
        where: { hardwareId },
      });
      if (sensor) actualSensorId = sensor.id;
    }

    if (!actualSensorId) {
      throw new NotFoundError(
        'Sensor not found. Provide a valid sensorId or hardwareId that matches a registered sensor.'
      );
    }

    return await prisma.sensorReading.create({
      data: {
        sensorId: actualSensorId,
        soilMoisture: soilMoisture !== undefined ? Number(soilMoisture) : null,
        soilTemp: soilTemp !== undefined ? Number(soilTemp) : null,
        ambientTemp: ambientTemp !== undefined ? Number(ambientTemp) : null,
        humidity: humidity !== undefined ? Number(humidity) : null,
        rainfallMm: rainfallMm !== undefined ? Number(rainfallMm) : null,
        batteryLevel: batteryLevel !== undefined ? Number(batteryLevel) : null,
        recordedAt: timestamp,
      },
    });
  }

  const fallbackReading = {
    id: `reading_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    sensorId: sensorId || hardwareId || 'sensor_demo_01',
    soilMoisture: soilMoisture !== undefined ? Number(soilMoisture) : 42.5,
    soilTemp: soilTemp !== undefined ? Number(soilTemp) : 21.0,
    ambientTemp: ambientTemp !== undefined ? Number(ambientTemp) : 24.5,
    humidity: humidity !== undefined ? Number(humidity) : 60.0,
    rainfallMm: rainfallMm !== undefined ? Number(rainfallMm) : 0.0,
    batteryLevel: batteryLevel !== undefined ? Number(batteryLevel) : 95.0,
    recordedAt: timestamp.toISOString(),
  };

  mockReadings.push(fallbackReading);
  return fallbackReading;
}

// Get sensors by farm
async function getSensorsByFarm(farmId) {
  if (isConnected()) {
    if (!farmId) return [];
    return await prisma.sensor.findMany({
      where: { farmId },
      include: { readings: { take: 5, orderBy: { recordedAt: 'desc' } } },
    });
  }

  const list = Array.from(mockSensors.values()).filter(
    (s) => !farmId || s.farmId === farmId
  );
  return list;
}

const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Ingest or sync telemetry data from Firebase (Realtime Database or Firestore REST)
 */
async function syncFirebaseTelemetry({ firebaseUrl, apiKey, hardwareId, farmId }) {
  if (!firebaseUrl) {
    throw new BadRequestError('firebaseUrl is required (e.g. https://<project>.firebaseio.com/sensors.json)');
  }

  let cleanUrl = firebaseUrl.trim();
  if (apiKey && !cleanUrl.includes('auth=')) {
    cleanUrl += cleanUrl.includes('?') ? `&auth=${apiKey}` : `?auth=${apiKey}`;
  }

  logger.info(`[FirebaseSensorConnector] Fetching telemetry from ${firebaseUrl.split('?')[0]}`);
  
  const response = await axios.get(cleanUrl, { timeout: 15000 });
  const rawData = response.data;

  const records = [];
  if (Array.isArray(rawData)) {
    records.push(...rawData);
  } else if (rawData && typeof rawData === 'object') {
    for (const [key, val] of Object.entries(rawData)) {
      if (val && typeof val === 'object') {
        records.push({ hardwareId: val.hardwareId || key, ...val });
      }
    }
  }

  const results = [];
  for (const item of records) {
    const hwId = item.hardwareId || item.device_id || item.sensorId || hardwareId || 'AGRI-FIREBASE-01';
    const reading = await recordTelemetry({
      hardwareId: hwId,
      soilMoisture: item.soilMoisture ?? item.moisture ?? item.soil_moisture,
      soilTemp: item.soilTemp ?? item.soil_temperature,
      ambientTemp: item.ambientTemp ?? item.temperature ?? item.temp,
      humidity: item.humidity ?? item.relative_humidity,
      rainfallMm: item.rainfallMm ?? item.rainfall ?? item.rain,
      batteryLevel: item.batteryLevel ?? item.battery ?? item.battery_pct,
      recordedAt: item.timestamp || item.recordedAt || item.created_at,
    });
    results.push(reading);
  }

  return {
    success: true,
    message: `Successfully ingested ${results.length} telemetry readings from Firebase`,
    count: results.length,
    readings: results,
  };
}

/**
 * Ingest real-time stream / webhook push from Firebase Cloud Functions or ESP32/IoT device
 */
async function receiveFirebaseStream(data) {
  const {
    hardwareId,
    device_id,
    sensorId,
    farmId,
    soilMoisture,
    moisture,
    soil_moisture,
    soilTemp,
    soil_temperature,
    ambientTemp,
    temperature,
    temp,
    humidity,
    rainfallMm,
    rainfall,
    batteryLevel,
    battery,
    timestamp,
    recordedAt,
  } = data || {};

  const hwId = hardwareId || device_id || sensorId || 'AGRI-FIREBASE-STREAM';

  if (isConnected()) {
    let sensor = await prisma.sensor.findFirst({ where: { hardwareId: hwId } });
    if (!sensor) {
      let targetFarmId = farmId;
      if (!targetFarmId) {
        const firstFarm = await prisma.farm.findFirst();
        targetFarmId = firstFarm ? firstFarm.id : null;
      }

      if (targetFarmId) {
        await prisma.sensor.create({
          data: {
            farmId: targetFarmId,
            hardwareId: hwId,
            sensorType: 'SOIL_MOISTURE',
            isActive: true,
          },
        }).catch((e) => logger.warn(`[FirebaseSensor] Auto-provision warning: ${e.message}`));
      }
    }
  }

  return await recordTelemetry({
    hardwareId: hwId,
    soilMoisture: soilMoisture ?? moisture ?? soil_moisture,
    soilTemp: soilTemp ?? soil_temperature,
    ambientTemp: ambientTemp ?? temperature ?? temp,
    humidity,
    rainfallMm: rainfallMm ?? rainfall,
    batteryLevel: batteryLevel ?? battery,
    recordedAt: timestamp || recordedAt,
  });
}

module.exports = {
  registerSensor,
  recordTelemetry,
  getSensorsByFarm,
  syncFirebaseTelemetry,
  receiveFirebaseStream,
  mockSensors,
};
