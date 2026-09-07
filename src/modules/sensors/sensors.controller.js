const sensorsService = require('./sensors.service');
const { prisma } = require('../../config/db');

async function registerSensor(req, res, next) {
  try {
    const { farmId, farmerId, userId, hardwareId, serialNumber, sensorType, deviceType, firmwareVersion } = req.body;
    const sensor = await sensorsService.registerSensor({
      farmId,
      farmerId: farmerId || userId,
      hardwareId,
      serialNumber,
      sensorType,
      deviceType,
      firmwareVersion,
      user: req.user,
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

    // If a specific farm is requested, return sensors for that farm
    if (farmId) {
      const data = await sensorsService.getSensorsByFarm(farmId);
      return res.status(200).json({ success: true, data });
    }

    // Otherwise, scope sensors by user jurisdiction
    const user = req.user || {};
    const role = (user.role || '').toUpperCase();
    const { prisma } = require('../../config/db');
    let where = {};

    if (role === 'FARMER') {
      where = { farm: { userId: user.id } };
    } else if (role === 'DEVELOPMENT_AGENT' || role === 'WOREDA_OFFICER') {
      if (user.woredaId) where = { farm: { woredaId: user.woredaId } };
    } else if (role === 'ZONAL_OFFICER') {
      if (user.zoneId) where = { farm: { woreda: { zoneId: user.zoneId } } };
    } else if (role === 'REGIONAL_OFFICER') {
      if (user.regionId) where = { farm: { woreda: { zone: { regionId: user.regionId } } } };
    }
    // ADMIN and RESEARCHER: no scope filters

    const data = await prisma.sensor.findMany({
      where,
      include: {
        readings: { take: 5, orderBy: { recordedAt: 'desc' } },
        farm: { select: { id: true, farmName: true, userId: true, woredaId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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
    if (!userId) {
      return res.status(400).json({ success: false, error: { message: 'userId is required' } });
    }

    const caller = req.user;
    const callerRole = (caller?.role || '').toUpperCase();

    if (callerRole === 'FARMER' && caller.id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied: You can only view your own sensors', code: 'FORBIDDEN' },
      });
    }

    if (callerRole === 'DEVELOPMENT_AGENT' || callerRole === 'WOREDA_OFFICER') {
      const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { woredaId: true } });
      if (!targetUser || (caller.woredaId && targetUser.woredaId !== caller.woredaId)) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied: Farmer is outside your woreda jurisdiction', code: 'FORBIDDEN' },
        });
      }
    } else if (callerRole === 'ZONAL_OFFICER') {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { zoneId: true, woreda: { select: { zoneId: true } } },
      });
      const targetZoneId = targetUser?.zoneId || targetUser?.woreda?.zoneId;
      if (!targetUser || (caller.zoneId && targetZoneId !== caller.zoneId)) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied: Farmer is outside your zone jurisdiction', code: 'FORBIDDEN' },
        });
      }
    } else if (callerRole === 'REGIONAL_OFFICER') {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { regionId: true, woreda: { select: { zone: { select: { regionId: true } } } } },
      });
      const targetRegionId = targetUser?.regionId || targetUser?.woreda?.zone?.regionId;
      if (!targetUser || (caller.regionId && targetRegionId !== caller.regionId)) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied: Farmer is outside your region jurisdiction', code: 'FORBIDDEN' },
        });
      }
    }

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

async function getSensorDetails(req, res, next) {
  try {
    const { id } = req.params;
    const sensor = await sensorsService.getSensorById(id);
    if (!sensor) {
      return res.status(404).json({ success: false, error: { message: 'Sensor not found', code: 'NOT_FOUND' } });
    }
    res.status(200).json({ success: true, data: sensor });
  } catch (error) {
    next(error);
  }
}

async function updateSensor(req, res, next) {
  try {
    const { id } = req.params;
    const clientUpdatedAt =
      req.headers['if-unmodified-since'] ||
      req.body.clientUpdatedAt ||
      req.body.updatedAt ||
      req.body.lastUpdatedAt;

    const updated = await sensorsService.updateSensor({
      id,
      data: req.body,
      user: req.user,
      clientUpdatedAt,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function getSensorTelemetry(req, res, next) {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit } = req.query;
    const data = await sensorsService.getSensorTelemetry({
      id,
      startDate,
      endDate,
      limit,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getLatestSensorReading(req, res, next) {
  try {
    const { hardwareId, id } = req.params;
    const target = hardwareId || id;
    const data = await sensorsService.getLatestSensorReading(target);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerSensor,
  recordTelemetry,
  getSensors,
  getSensorDetails,
  updateSensor,
  getMySensors,
  getFarmerSensors,
  claimSensor,
  getSensorTelemetry,
  getLatestSensorReading,
};


