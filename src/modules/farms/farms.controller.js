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
    const soilType = body.soilType || body.soil_type;
    const irrigationType = body.irrigationType || body.irrigation_type;

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
      soilType,
      irrigationType,
    });
    res.status(201).json({ success: true, data: farm });
  } catch (error) {
    next(error);
  }
}

async function getFarms(req, res, next) {
  try {
    const data = await farmsService.getFarmsByScope(req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getFarmDetails(req, res, next) {
  try {
    const data = await farmsService.getFarmById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Farm not found' });

    // ── RBAC: Verify the requesting user has access to this farm ──
    const user = req.user;
    const userRole = (user?.role || '').toUpperCase();

    if (userRole === 'FARMER') {
      // Farmers can only view their own farms
      if (data.userId && data.userId !== user.id) {
        return res.status(403).json({ success: false, error: { message: 'Access denied: you can only view your own farms', code: 'FORBIDDEN' } });
      }
    } else if (userRole === 'DEVELOPMENT_AGENT' || userRole === 'WOREDA_OFFICER') {
      // DAs and Woreda Officers can view farms within their woreda
      if (user.woredaId && data.woredaId && data.woredaId !== user.woredaId) {
        return res.status(403).json({ success: false, error: { message: 'Access denied: this farm is outside your woreda jurisdiction', code: 'FORBIDDEN' } });
      }
    } else if (userRole === 'ZONAL_OFFICER') {
      // Zonal Officers can view farms within their zone (checked directly or via woreda relation)
      const farmZoneId = data.zoneId || data.woreda?.zoneId;
      if (user.zoneId && farmZoneId && farmZoneId !== user.zoneId) {
        return res.status(403).json({ success: false, error: { message: 'Access denied: this farm is outside your zone jurisdiction', code: 'FORBIDDEN' } });
      }
    } else if (userRole === 'REGIONAL_OFFICER') {
      // Regional Officers can view farms within their region (checked directly or via woreda zone relation)
      const farmRegionId = data.regionId || data.woreda?.zone?.regionId;
      if (user.regionId && farmRegionId && farmRegionId !== user.regionId) {
        return res.status(403).json({ success: false, error: { message: 'Access denied: this farm is outside your region jurisdiction', code: 'FORBIDDEN' } });
      }
    }
    // ADMIN and RESEARCHER have unrestricted access

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
