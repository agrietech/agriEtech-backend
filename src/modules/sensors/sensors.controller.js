const sensorsService = require('./sensors.service');

async function registerSensor(req, res, next) {
  try {
    const { farmId, deviceType, serialNumber, firmwareVersion } = req.body;
    if (!farmId) {
      return res.status(400).json({ success: false, error: 'farmId is required' });
    }
    const sensor = await sensorsService.registerSensor({
      farmId,
      deviceType,
      serialNumber,
      firmwareVersion,
    });
    res.status(201).json({ success: true, data: sensor });
  } catch (error) {
    next(error);
  }
}

async function getSensors(req, res, next) {
  try {
    const data = await sensorsService.getSensorsByFarm(req.query.farmId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerSensor,
  getSensors,
};
