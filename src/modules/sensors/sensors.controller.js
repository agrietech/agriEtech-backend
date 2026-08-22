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

async function syncFirebase(req, res, next) {
  try {
    const { firebaseUrl, apiKey, hardwareId, farmId } = req.body || {};
    const url = firebaseUrl || req.query.firebaseUrl || process.env.FIREBASE_DATABASE_URL;
    const key = apiKey || req.query.apiKey || process.env.FIREBASE_API_KEY;
    const result = await sensorsService.syncFirebaseTelemetry({
      firebaseUrl: url,
      apiKey: key,
      hardwareId,
      farmId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function receiveFirebaseStream(req, res, next) {
  try {
    const reading = await sensorsService.receiveFirebaseStream(req.body);
    res.status(201).json({ success: true, message: 'Firebase stream telemetry recorded', data: reading });
  } catch (error) {
    next(error);
  }
}

async function getFirebaseStatus(req, res) {
  const isConfigured = Boolean(process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_DATABASE_URL);
  res.status(200).json({
    success: true,
    status: isConfigured ? 'CONFIGURED' : 'READY_FOR_INTEGRATION',
    receiverEndpoints: {
      sync: '/api/v1/sensors/firebase/sync',
      stream: '/api/v1/sensors/firebase/stream',
      webhook: '/api/v1/sensors/firebase/webhook',
    },
    supportedPayloadFormat: {
      hardwareId: 'AGRI-NODE-ETH-001',
      farmId: 'uuid-optional',
      soilMoisture: 38.5,
      soilTemp: 22.0,
      ambientTemp: 24.5,
      humidity: 62.0,
      rainfallMm: 0.0,
      batteryLevel: 98.0,
      timestamp: '2026-08-22T19:40:00Z',
    },
  });
}

module.exports = {
  registerSensor,
  recordTelemetry,
  getSensors,
  syncFirebase,
  receiveFirebaseStream,
  getFirebaseStatus,
};
