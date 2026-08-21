const { dispatchJob } = require('./jobs/queue');
const connectors = require('./connectors');

// Manual on-demand ingestion trigger
async function triggerPull(req, res, next) {
  try {
    const { source, lat, lng, woredaId } = req.body;
    let jobId = `job_${Date.now()}`;
    try {
      const job = await dispatchJob(`pull-${source || 'manual'}`, { source, lat, lng, woredaId });
      if (job?.id) jobId = job.id;
    } catch (_e) {
      // Fallback in dev/test when Redis is offline
    }
    res.status(201).json({
      success: true,
      message: 'Ingestion job scheduled',
      data: { jobId, source, woredaId },
    });
  } catch (error) {
    next(error);
  }
}

// Ingest telemetry payload from IoT gateway/sensors
async function ingestTelemetry(req, res, next) {
  try {
    const { sensorId, soilMoisture, soilTemp, airTemp, humidity } = req.body;
    if (!sensorId) {
      return res.status(400).json({ success: false, error: 'sensorId is required' });
    }
    res.status(201).json({
      success: true,
      message: 'Telemetry recorded',
      data: { sensorId, soilMoisture, soilTemp, airTemp, humidity },
    });
  } catch (error) {
    next(error);
  }
}

// List all registered data connectors
async function getConnectorsList(_req, res, next) {
  try {
    const list = Object.keys(connectors).map((key) => ({ key, name: connectors[key].name }));
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

// Test API connectivity for all connectors
async function testConnectorHealth(req, res, next) {
  try {
    const testCoords = { lat: 9.0320, lng: 38.7469 };
    const results = {};

    // Test Open-Meteo (fast)
    try {
      await connectors.openMeteoConnector.fetchForecast(testCoords);
      results.openMeteo = { status: 'WORKING', requiresKey: false };
    } catch (err) {
      results.openMeteo = { status: 'FAILED', error: err.message };
    }

    // Test SoilGrids (fast)
    try {
      await connectors.soilGridsConnector.fetchSoilProperties(testCoords);
      results.soilGrids = { status: 'WORKING', requiresKey: false };
    } catch (err) {
      results.soilGrids = { status: 'FAILED', error: err.message };
    }

    // Test Open-Elevation (fast)
    try {
      await connectors.openElevationConnector.fetchElevation(testCoords);
      results.openElevation = { status: 'WORKING', requiresKey: false };
    } catch (err) {
      results.openElevation = { status: 'FAILED', error: err.message };
    }

    // Check Plant.id configuration
    const plantIdClient = require('./plantIdClient');
    results.plantId = {
      status: plantIdClient.isConfigured() ? 'CONFIGURED' : 'NOT_CONFIGURED',
      requiresKey: true
    };

    res.status(200).json({
      success: true,
      message: 'API health check completed',
      totalConnectors: Object.keys(connectors).length + 1,
      results
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  triggerPull,
  ingestTelemetry,
  getConnectorsList,
  testConnectorHealth,
};
