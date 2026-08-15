const { dispatchJob } = require('./jobs/queue');
const connectors = require('./connectors');

// Manual on-demand ingestion trigger
async function triggerPull(req, res, next) {
  try {
    const { source, lat, lng, woredaId } = req.body;
    const job = await dispatchJob(`pull-${source || 'manual'}`, { source, lat, lng, woredaId });
    res
      .status(202)
      .json({ success: true, message: 'Ingestion job scheduled', data: { jobId: job.id } });
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
      data: { sensorId, recorded: { soilMoisture, soilTemp, airTemp, humidity } },
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

module.exports = {
  triggerPull,
  ingestTelemetry,
  getConnectorsList,
};
