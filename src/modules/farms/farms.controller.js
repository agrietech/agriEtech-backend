const farmsService = require('./farms.service');

async function createFarm(req, res, next) {
  try {
    const { name, cropType, areaHectares, lat, lng, woredaId } = req.body;
    if (!name || !lat || !lng) {
      return res.status(400).json({ success: false, error: 'Name, lat, and lng are required' });
    }
    const farm = await farmsService.createFarm({
      userId: req.user?.id || 'usr_dev_01',
      name,
      cropType,
      areaHectares,
      lat,
      lng,
      woredaId,
    });
    res.status(201).json({ success: true, data: farm });
  } catch (error) {
    next(error);
  }
}

async function getFarms(req, res, next) {
  try {
    const data = await farmsService.getFarmsByUser(req.user?.id || 'usr_dev_01');
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getFarmDetails(req, res, next) {
  try {
    const data = await farmsService.getFarmById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Farm not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createFarm,
  getFarms,
  getFarmDetails,
};
