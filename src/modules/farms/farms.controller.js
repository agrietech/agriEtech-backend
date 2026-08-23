const farmsService = require('./farms.service');
const { validateFarmData } = require('../../validation/schemas');

async function createFarm(req, res, next) {
  try {
    validateFarmData(req.body);
    const body = req.body || {};
    const farmName = body.farmName || body.name || body.title || 'My Farm Plot';
    const primaryCrop = body.primaryCrop || body.cropType || body.crop || 'Mixed Crops';
    const areaHectares = body.areaHectares !== undefined ? Number(body.areaHectares) : (body.size !== undefined ? Number(body.size) : (body.area !== undefined ? Number(body.area) : 1.0));
    const woredaId = body.woredaId || body.woreda_id || (body.woreda && body.woreda.id);
    const polygonGeojson = body.polygonGeojson || body.geoJsonBoundary || body.boundary;
    const latitude = body.latitude !== undefined ? Number(body.latitude) : (body.lat !== undefined ? Number(body.lat) : undefined);
    const longitude = body.longitude !== undefined ? Number(body.longitude) : (body.lng !== undefined ? Number(body.lng) : (body.lon !== undefined ? Number(body.lon) : undefined));

    const userId = req.user?.id || req.user?.userId || 'usr_farmer_01';

    const farm = await farmsService.createFarm({
      userId,
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
