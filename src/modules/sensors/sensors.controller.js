const sensorsService = require('./sensors.service');

async function registerSensor(req, res, next) {
  try {
    const { farmId, hardwareId, serialNumber, sensorType, deviceType, firmwareVersion } = req.body;
    if (!farmId) {
      return res.status(400).json({ success: false, error: 'farmId is required' });
    }
    const sensor = await sensorsService.registerSensor({
      farmId,
      hardwareId,
      serialNumber,
      sensorType,
      deviceType,
      firmwareVersion,
    });
    res.status(201).json({ success: true, data: sensor });
  } catch (error) {
    next(error);
  }
}

async function recordTelemetry(req, res, next) {
  try {
    const { sensorId, hardwareId, soilMoisture, soilTemp, ambientTemp, humidity, rainfallMm, batteryLevel, recordedAt } = req.body;
    const reading = await sensorsService.recordTelemetry({
      sensorId,
      hardwareId,
      soilMoisture,
      soilTemp,
      ambientTemp,
      humidity,
      rainfallMm,
      batteryLevel,
      recordedAt,
    });
    res.status(201).json({ success: true, data: reading });
  } catch (error) {
    next(error);
  }
}

async function getSensors(req, res, next) {
  try {
    const farmId = req.params.farmId || req.query.farmId;
    const data = await sensorsService.getSensorsByFarm(farmId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerSensor,
  recordTelemetry,
  getSensors,
};
