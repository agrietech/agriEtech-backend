const sensorsService = require('./sensors.service');
const { FirebaseSensorConnector } = require('../../ingestion/connectors/firebaseSensorConnector');
const env = require('../../config/env');

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
    const { sensorId, hardwareId, farmId, soilMoisture, soilTemp, ambientTemp, humidity, rainfallMm, batteryLevel, recordedAt } = req.body;
    const reading = await sensorsService.recordTelemetry({
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

async function getMySensors(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const data = await sensorsService.getSensorsByFarmer(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getFarmerSensors(req, res, next) {
  try {
    const userId = req.params.userId || req.query.userId;
    const data = await sensorsService.getSensorsByFarmer(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function claimSensor(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { farmId, hardwareId, serialNumber, sensorType } = req.body || {};
    const sensor = await sensorsService.claimSensor({
      userId,
      farmId,
      hardwareId,
      serialNumber,
      sensorType,
    });
    res.status(201).json({ success: true, message: 'Sensor attached to farm successfully', data: sensor });
  } catch (error) {
    next(error);
  }
}

async function syncFirebase(req, res, next) {
  try {
    const body = req.body || {};
    const query = req.query || {};
    const firebaseUrl = body.firebaseUrl || query.firebaseUrl || env.FIREBASE_DATABASE_URL;
    const apiKey = body.apiKey || query.apiKey || env.FIREBASE_API_KEY;
    const path = body.path || query.path;
    const hardwareId = body.hardwareId || query.hardwareId;
    const farmId = body.farmId || query.farmId;

    const result = await sensorsService.syncFirebaseTelemetry({
      firebaseUrl,
      apiKey,
      path,
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

async function testFirebaseConnection(req, res, next) {
  try {
    const query = req.query || {};
    const body = req.body || {};
    const url = body.firebaseUrl || query.firebaseUrl || env.FIREBASE_DATABASE_URL;
    const apiKey = body.apiKey || query.apiKey || env.FIREBASE_API_KEY;
    const path = body.path || query.path || '';

    const connector = new FirebaseSensorConnector({ baseUrl: url, apiKey });
    const result = await connector.testConnection(path);
    res.status(result.success ? 200 : (result.statusCode || 502)).json({
      success: result.success,
      databaseUrl: url,
      apiKeyConfigured: Boolean(apiKey),
      diagnostics: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getFirebaseStatus(req, res) {
  const dbUrl = env.FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;
  const isConfigured = Boolean(dbUrl);
  res.status(200).json({
    success: true,
    status: isConfigured ? 'CONFIGURED' : 'READY_FOR_INTEGRATION',
    databaseUrl: dbUrl,
    projectId: env.FIREBASE_PROJECT_ID || 'arduinomoisture',
    apiKeyConfigured: Boolean(env.FIREBASE_API_KEY),
    receiverEndpoints: {
      sync: '/api/v1/sensors/firebase/sync',
      stream: '/api/v1/sensors/firebase/stream',
      webhook: '/api/v1/sensors/firebase/webhook',
      test: '/api/v1/sensors/firebase/test',
    },
    supportedPayloadFormat: {
      hardwareId: 'ARDUINO-MOISTURE-01',
      farmId: 'uuid-optional',
      soilMoisture: 38.5,
      soilTemp: 22.0,
      ambientTemp: 24.5,
      humidity: 62.0,
      rainfallMm: 0.0,
      batteryLevel: 98.0,
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = {
  registerSensor,
  recordTelemetry,
  getSensors,
  getMySensors,
  getFarmerSensors,
  claimSensor,
  syncFirebase,
  receiveFirebaseStream,
  testFirebaseConnection,
  getFirebaseStatus,
};

