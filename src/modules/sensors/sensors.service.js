const { prisma, isConnected } = require('../../config/db');

// Register IoT sensor device
async function registerSensor({ farmId, deviceType, serialNumber, firmwareVersion }) {
  if (isConnected()) {
    return await prisma.sensor.create({
      data: {
        farmId,
        deviceType: deviceType || 'SOIL_MOISTURE_PROBE',
        serialNumber: serialNumber || `SN-${Date.now()}`,
        firmwareVersion: firmwareVersion || 'v1.0.0',
        status: 'ACTIVE',
      },
    });
  }

  return {
    id: `sensor_${Date.now()}`,
    farmId,
    deviceType: deviceType || 'SOIL_MOISTURE_PROBE',
    serialNumber,
    status: 'ACTIVE',
  };
}

// Get sensors by farm
async function getSensorsByFarm(farmId) {
  if (isConnected() && farmId) {
    return await prisma.sensor.findMany({ where: { farmId } });
  }
  return [{ id: 'sensor_01', farmId, deviceType: 'SOIL_MOISTURE_PROBE', status: 'ACTIVE' }];
}

module.exports = {
  registerSensor,
  getSensorsByFarm,
};
