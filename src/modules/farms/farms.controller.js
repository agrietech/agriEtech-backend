const farmsService = require('./farms.service');
const { validateFarmData } = require('../../validation/schemas');

async function createFarm(req, res, next) {
  try {
    validateFarmData(req.body);
    
    const { farmName, primaryCrop, areaHectares, woredaId, polygonGeojson, latitude, longitude } = req.body;
    const farm = await farmsService.createFarm({
      userId: req.user.id,
      farmName,
      primaryCrop,
      areaHectares,
      woredaId,
      polygonGeojson,
      latitude,
      longitude,
    });
    res.status(201).json({ success: true, data: farm });
  } catch (error) {
    next(error);
  }
}

async function getFarms(req, res, next) {
  try {
    const data = await farmsService.getFarmsByUser(req.user?.id);
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
