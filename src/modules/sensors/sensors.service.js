const { prisma, isConnected } = require('../../config/db');

// Register IoT sensor device
async function registerSensor({ farmId, hardwareId, serialNumber, sensorType, deviceType, firmwareVersion }) {
  const finalHardwareId = hardwareId || serialNumber || `NODE-${Date.now()}`;
  const finalSensorType = sensorType || deviceType || 'SOIL_MOISTURE';

  if (isConnected()) {
    return await prisma.sensor.create({
      data: {
        farmId,
        hardwareId: finalHardwareId,
        sensorType: finalSensorType,
        isActive: true,
      },
    });
  }

  return {
    id: `sensor_${Date.now()}`,
    farmId,
    hardwareId: finalHardwareId,
    sensorType: finalSensorType,
    isActive: true,
    firmwareVersion: firmwareVersion || 'v1.0.0',
    createdAt: new Date().toISOString(),
  };
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
    // Find sensor if hardwareId passed
    let actualSensorId = sensorId;
    if (hardwareId && !sensorId) {
      const sensor = await prisma.sensor.findFirst({
        where: { hardwareId },
      });
      if (sensor) actualSensorId = sensor.id;
    }

    if (actualSensorId) {
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
  }

  return {
    id: `reading_${Date.now()}`,
    sensorId: sensorId || hardwareId || 'AGRI-NODE-ETH-099',
    soilMoisture: soilMoisture !== undefined ? Number(soilMoisture) : null,
    soilTemp: soilTemp !== undefined ? Number(soilTemp) : null,
    ambientTemp: ambientTemp !== undefined ? Number(ambientTemp) : null,
    humidity: humidity !== undefined ? Number(humidity) : null,
    rainfallMm: rainfallMm !== undefined ? Number(rainfallMm) : null,
    batteryLevel: batteryLevel !== undefined ? Number(batteryLevel) : null,
    recordedAt: timestamp.toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// Get sensors by farm
async function getSensorsByFarm(farmId) {
  if (isConnected() && farmId) {
    return await prisma.sensor.findMany({
      where: { farmId },
      include: { readings: { take: 5, orderBy: { recordedAt: 'desc' } } },
    });
  }
  return [
    {
      id: 'sensor_01',
      farmId: farmId || 'farm_demo_01',
      hardwareId: 'AGRI-NODE-ETH-099',
      sensorType: 'SOIL_MOISTURE',
      isActive: true,
    },
  ];
}

module.exports = {
  registerSensor,
  recordTelemetry,
  getSensorsByFarm,
};
