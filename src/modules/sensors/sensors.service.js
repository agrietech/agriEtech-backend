const { prisma, isConnected } = require('../../config/db');
const { BadRequestError, NotFoundError, ForbiddenError, ConflictError, ServiceUnavailableError } = require('../../utils/errors');
const env = require('../../config/env');
const crypto = require('crypto');

const logger = require('../../utils/logger');
const { FirebaseSensorConnector, normalizeSoilMoisture } = require('../../ingestion/connectors/firebaseSensorConnector');

// Register or provision an IoT sensor device for an individual farmer or farm
async function registerSensor({
  farmId,
  farmerId,
  userId,
  hardwareId,
  serialNumber,
  sensorType,
  deviceType,
  user,
}) {
  const finalHardwareId = (hardwareId || serialNumber || '').trim();
  const finalSensorType = sensorType || deviceType || 'SOIL_MOISTURE';

  if (!finalHardwareId) {
    throw new BadRequestError('hardwareId or serialNumber is required');
  }

  const callerRole = (user?.role || 'FARMER').toUpperCase();
  const callerId = user?.id;

  let targetFarmId = farmId;
  let targetFarmerId = farmerId || userId;

  // If caller is a FARMER, target is always themselves
  if (callerRole === 'FARMER') {
    targetFarmerId = callerId;
  }

  // If farmId is not specified, resolve or auto-provision a plot for this farmer
  if (!targetFarmId) {
    const ownerId = targetFarmerId || callerId;
    if (ownerId) {
      let farm = await prisma.farm.findFirst({
        where: { userId: ownerId },
        orderBy: { createdAt: 'desc' },
      });

      if (!farm) {
        const farmerUser = await prisma.user.findUnique({ where: { id: ownerId } });
        if (!farmerUser) {
          throw new NotFoundError(`Farmer user with ID ${ownerId} not found`);
        }
        let woredaId = farmerUser.woredaId;
        if (!woredaId) {
          const firstWoreda = await prisma.woreda.findFirst();
          woredaId = firstWoreda?.id;
        }

        farm = await prisma.farm.create({
          data: {
            userId: ownerId,
            farmName: `${farmerUser.fullName || 'Farmer'}'s Farm Plot`,
            primaryCrop: 'Mixed Crops',
            latitude: 8.54,
            longitude: 39.27,
            woredaId,
          },
        });
      }
      targetFarmId = farm.id;
    }
  }

  if (!targetFarmId) {
    throw new BadRequestError('farmId or farmerId is required to register sensor');
  }

  const farm = await prisma.farm.findUnique({
    where: { id: targetFarmId },
    include: {
      user: { select: { id: true, fullName: true, phoneNumber: true, email: true, role: true } },
      woreda: { include: { zone: true } },
    },
  });

  if (!farm) {
    throw new NotFoundError(`Farm with ID ${targetFarmId} not found`);
  }

  // Jurisdictional / Ownership Authorization
  if (callerRole === 'FARMER' && farm.userId !== callerId) {
    throw new ForbiddenError('Access denied: You can only register sensors for your own farm');
  }
  if ((callerRole === 'DEVELOPMENT_AGENT' || callerRole === 'WOREDA_OFFICER') && user?.woredaId && farm.woredaId !== user.woredaId) {
    throw new ForbiddenError('Access denied: Farmer/farm is outside your woreda jurisdiction');
  }
  if (callerRole === 'ZONAL_OFFICER' && user?.zoneId && farm.woreda?.zoneId !== user.zoneId) {
    throw new ForbiddenError('Access denied: Farmer/farm is outside your zone jurisdiction');
  }
  if (callerRole === 'REGIONAL_OFFICER' && user?.regionId && farm.woreda?.zone?.regionId !== user.regionId) {
    throw new ForbiddenError('Access denied: Farmer/farm is outside your region jurisdiction');
  }

  // Check if sensor with this hardwareId already exists: update and reassign to this farmer's farm
  const existing = await prisma.sensor.findUnique({
    where: { hardwareId: finalHardwareId },
  });

  const generatedToken = 'sec_' + crypto.randomBytes(24).toString('hex');

  if (existing) {
    return await prisma.sensor.update({
      where: { id: existing.id },
      data: {
        farmId: targetFarmId,
        sensorType: finalSensorType,
        isActive: true,
        secretToken: existing.secretToken || generatedToken,
      },
      include: {
        farm: {
          include: {
            user: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
          },
        },
      },
    });
  }

  return await prisma.sensor.create({
    data: {
      farmId: targetFarmId,
      hardwareId: finalHardwareId,
      sensorType: finalSensorType,
      isActive: true,
      secretToken: generatedToken,
    },
    include: {
      farm: {
        include: {
          user: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
        },
      },
    },
  });
}

/**
 * Validate an incoming sensor secret token against database record
 */
async function verifySensorToken(hardwareId, token) {
  if (!hardwareId || !token) return false;
  try {
    const sensor = await prisma.sensor.findUnique({
      where: { hardwareId: String(hardwareId).trim() },
      select: { id: true, secretToken: true, isActive: true },
    });
    if (!sensor || !sensor.isActive) return false;
    if (sensor.secretToken && sensor.secretToken === String(token).trim()) {
      return true;
    }
    return false;
  } catch (err) {
    logger.error(`[SensorAuth] Token verification error for ${hardwareId}: ${err.message}`);
    return false;
  }
}


// Record authentic telemetry readings
async function recordTelemetry({
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
}) {
  const timestamp = recordedAt ? new Date(recordedAt) : new Date();
  const normalizedMoisture = normalizeSoilMoisture(soilMoisture);

  let actualSensorId = sensorId;

  if (hardwareId && !sensorId) {
    let sensor = await prisma.sensor.findFirst({
      where: { hardwareId },
    });

    // Auto-provision if sensor hardwareId is new
    if (!sensor) {
      let targetFarmId = farmId;
      if (!targetFarmId) {
        const defaultFarm = await prisma.farm.findFirst();
        targetFarmId = defaultFarm ? defaultFarm.id : null;
      }

      if (targetFarmId) {
        try {
          sensor = await prisma.sensor.create({
            data: {
              farmId: targetFarmId,
              hardwareId,
              sensorType: 'SOIL_MOISTURE',
              isActive: true,
            },
          });
        } catch (createErr) {
          logger.warn(`[SensorService] Auto-provision warning for ${hardwareId}: ${createErr.message}`);
        }
      }
    }

    if (sensor) actualSensorId = sensor.id;
  }

  if (!actualSensorId) {
    throw new BadRequestError('Valid sensorId or registered hardwareId is required to record telemetry');
  }

  return await prisma.sensorReading.create({
    data: {
      sensorId: actualSensorId,
      soilMoisture: normalizedMoisture !== null ? Number(normalizedMoisture) : null,
      soilTemp: soilTemp !== undefined && soilTemp !== null ? Number(soilTemp) : null,
      ambientTemp: ambientTemp !== undefined && ambientTemp !== null ? Number(ambientTemp) : null,
      humidity: humidity !== undefined && humidity !== null ? Number(humidity) : null,
      rainfallMm: rainfallMm !== undefined && rainfallMm !== null ? Number(rainfallMm) : null,
      batteryLevel: batteryLevel !== undefined && batteryLevel !== null ? Number(batteryLevel) : null,
      recordedAt: timestamp,
    },
    include: {
      sensor: {
        select: {
          id: true,
          hardwareId: true,
          sensorType: true,
          farmId: true,
        },
      },
    },
  });
}

// Get sensors by farm
async function getSensorsByFarm(farmId) {
  if (!farmId) return [];
  return await prisma.sensor.findMany({
    where: { farmId },
    include: {
      readings: { take: 10, orderBy: { recordedAt: 'desc' } },
      farm: { select: { id: true, farmName: true, userId: true } },
    },
  });
}

// Get all sensors owned by an individual farmer across all their farms
async function getSensorsByFarmer(userId) {
  if (!userId) {
    throw new BadRequestError('userId is required');
  }

  return await prisma.sensor.findMany({
    where: {
      farm: { userId },
    },
    include: {
      farm: {
        select: {
          id: true,
          farmName: true,
          latitude: true,
          longitude: true,
          primaryCrop: true,
        },
      },
      readings: {
        take: 10,
        orderBy: { recordedAt: 'desc' },
      },
    },
  });
}

// Allow an individual farmer to claim/register a sensor device to their farm
async function claimSensor({ userId, farmId, hardwareId, serialNumber, sensorType = 'SOIL_MOISTURE' }) {
  const hwId = hardwareId || serialNumber;
  if (!hwId) {
    throw new BadRequestError('hardwareId or serialNumber is required');
  }
  if (!farmId) {
    throw new BadRequestError('farmId is required');
  }

  // Verify farmer owns the target farm
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
  });

  if (!farm) {
    throw new NotFoundError(`Farm with ID ${farmId} not found`);
  }

  if (userId && farm.userId !== userId) {
    throw new BadRequestError('You do not have permission to attach sensors to this farm');
  }

  // Check if sensor exists
  const existing = await prisma.sensor.findFirst({
    where: { hardwareId: hwId },
  });

  if (existing) {
    return await prisma.sensor.update({
      where: { id: existing.id },
      data: {
        farmId,
        sensorType: sensorType || existing.sensorType,
        isActive: true,
      },
    });
  }

  // Create new sensor record
  return await prisma.sensor.create({
    data: {
      farmId,
      hardwareId: hwId,
      sensorType,
      isActive: true,
    },
  });
}

/**
 * Ingest or sync telemetry data from Firebase
 */
async function syncFirebaseTelemetry({ firebaseUrl, apiKey, path, hardwareId, farmId } = {}) {
  const url = firebaseUrl || env.FIREBASE_DATABASE_URL || 'https://arduinomoisture-default-rtdb.firebaseio.com';
  const key = apiKey || env.FIREBASE_API_KEY;

  logger.info(`[FirebaseSensorConnector] Initiating sync with Firebase RTDB at ${url}`);

  const connector = new FirebaseSensorConnector({ baseUrl: url, apiKey: key });
  const fetchResult = await connector.fetchTelemetry({
    path,
    firebaseUrl: url,
    apiKey: key,
    defaultHardwareId: hardwareId || 'ARDUINO-MOISTURE-01',
  });

  const readings = [];
  for (const record of fetchResult.readings) {
    try {
      const reading = await recordTelemetry({
        hardwareId: record.hardwareId || hardwareId || 'ARDUINO-MOISTURE-01',
        farmId: record.farmId || farmId,
        soilMoisture: record.soilMoisture,
        soilTemp: record.soilTemp,
        ambientTemp: record.ambientTemp,
        humidity: record.humidity,
        rainfallMm: record.rainfallMm,
        batteryLevel: record.batteryLevel,
        recordedAt: record.recordedAt,
      });
      readings.push(reading);
    } catch (err) {
      logger.warn(`[FirebaseSensorConnector] Failed to insert record: ${err.message}`);
    }
  }

  return {
    success: true,
    message: `Successfully synchronized ${readings.length} telemetry readings from Firebase Realtime Database`,
    count: readings.length,
    endpoint: fetchResult.endpoint,
    readings,
  };
}

/**
 * Ingest real-time stream / webhook push from Firebase or IoT hardware
 */
async function receiveFirebaseStream(data) {
  const {
    hardwareId,
    hardware_id,
    device_id,
    deviceId,
    sensorId,
    sensor_id,
    farmId,
    farm_id,
    soilMoisture,
    moisture,
    soil_moisture,
    soilMoisturePct,
    val,
    value,
    raw,
    analog,
    soilTemp,
    soil_temp,
    soil_temperature,
    ambientTemp,
    temperature,
    temp,
    airTemp,
    air_temp,
    humidity,
    relative_humidity,
    rh,
    rainfallMm,
    rainfall,
    rain,
    batteryLevel,
    battery,
    battery_pct,
    batt,
    timestamp,
    recordedAt,
    time,
  } = data || {};

  const hwId =
    hardwareId ||
    hardware_id ||
    device_id ||
    deviceId ||
    sensorId ||
    sensor_id ||
    'ARDUINO-FIREBASE-STREAM';

  return await recordTelemetry({
    hardwareId: hwId,
    farmId: farmId || farm_id,
    soilMoisture:
      soilMoisture ??
      moisture ??
      soil_moisture ??
      soilMoisturePct ??
      val ??
      value ??
      raw ??
      analog,
    soilTemp: soilTemp ?? soil_temp ?? soil_temperature,
    ambientTemp: ambientTemp ?? temperature ?? temp ?? airTemp ?? air_temp,
    humidity: humidity ?? relative_humidity ?? rh,
    rainfallMm: rainfallMm ?? rainfall ?? rain,
    batteryLevel: batteryLevel ?? battery ?? battery_pct ?? batt,
    recordedAt: timestamp || recordedAt || time,
  });
}

// Update sensor with Optimistic Concurrency Control (OCC) and ownership checks
async function updateSensor({ id, data = {}, user = {}, clientUpdatedAt }) {
  if (!isConnected()) {
    throw new ServiceUnavailableError('Database service unavailable for sensor updates');
  }

  const existing = await prisma.sensor.findUnique({
    where: { id },
    include: {
      farm: {
        include: {
          woreda: {
            include: {
              zone: true,
            },
          },
        },
      },
    },
  });

  if (!existing) {
    throw new NotFoundError(`Sensor with ID ${id} not found`);
  }

  // 1. Ownership & Jurisdictional Authorization
  const role = (user.role || 'FARMER').toUpperCase();
  if (role !== 'ADMIN') {
    if (role === 'FARMER' && existing.farm.userId !== user.id) {
      throw new ForbiddenError('Access denied: You can only update sensors on your own farms');
    }
    if ((role === 'DEVELOPMENT_AGENT' || role === 'WOREDA_OFFICER') && user.woredaId && existing.farm.woredaId !== user.woredaId) {
      throw new ForbiddenError('Access denied: Sensor is outside your woreda jurisdiction');
    }
    if (role === 'ZONAL_OFFICER' && user.zoneId && existing.farm.woreda?.zoneId !== user.zoneId) {
      throw new ForbiddenError('Access denied: Sensor is outside your zone jurisdiction');
    }
    if (role === 'REGIONAL_OFFICER' && user.regionId && existing.farm.woreda?.zone?.regionId !== user.regionId) {
      throw new ForbiddenError('Access denied: Sensor is outside your region jurisdiction');
    }
  }

  // 2. Optimistic Concurrency Control (OCC)
  const clientTs = clientUpdatedAt || data.clientUpdatedAt || data.updatedAt || data.lastUpdatedAt;
  if (clientTs) {
    const clientTime = new Date(clientTs).getTime();
    const serverTime = new Date(existing.updatedAt).getTime();
    if (!isNaN(clientTime) && serverTime - clientTime > 500) {
      throw new ConflictError(
        'Concurrency conflict: Sensor settings were modified by another session. Please refresh and re-apply.',
        'CONCURRENCY_CONFLICT',
        {
          currentUpdatedAt: existing.updatedAt.toISOString(),
          clientUpdatedAt: new Date(clientTs).toISOString(),
          conflictRecord: {
            id: existing.id,
            hardwareId: existing.hardwareId,
            isActive: existing.isActive,
            sensorType: existing.sensorType,
            updatedAt: existing.updatedAt,
          },
        }
      );
    }
  }

  // 3. Apply updates
  const updatePayload = {};
  if (typeof data.isActive === 'boolean') updatePayload.isActive = data.isActive;
  if (data.sensorType) updatePayload.sensorType = data.sensorType;
  if (data.farmId && data.farmId !== existing.farmId) {
    // If moving to another farm, verify ownership of destination farm
    const targetFarm = await prisma.farm.findUnique({ where: { id: data.farmId } });
    if (!targetFarm) throw new NotFoundError(`Destination farm ${data.farmId} not found`);
    if (role === 'FARMER' && targetFarm.userId !== user.id) {
      throw new ForbiddenError('Cannot move sensor to a farm you do not own');
    }
    updatePayload.farmId = data.farmId;
  }

  return await prisma.sensor.update({
    where: { id },
    data: updatePayload,
    include: { farm: true },
  });
}

// Get single sensor by ID
async function getSensorById(id) {
  return await prisma.sensor.findUnique({
    where: { id },
    include: {
      farm: {
        include: {
          woreda: {
            include: {
              zone: true,
            },
          },
        },
      },
      readings: {
        take: 20,
        orderBy: { recordedAt: 'desc' },
      },
    },
  });
}

// Get telemetry history for a sensor by id or hardwareId
async function getSensorTelemetry({ id, hardwareId, startDate, endDate, limit = 50 } = {}) {
  const target = id || hardwareId;
  if (!target) {
    throw new BadRequestError('Sensor ID or Hardware ID is required');
  }

  const sensor = await prisma.sensor.findFirst({
    where: {
      OR: [{ id: target }, { hardwareId: target }],
    },
  });

  if (!sensor) {
    throw new NotFoundError(`Sensor with identifier '${target}' not found`);
  }

  const where = { sensorId: sensor.id };
  if (startDate || endDate) {
    where.recordedAt = {};
    if (startDate) where.recordedAt.gte = new Date(startDate);
    if (endDate) where.recordedAt.lte = new Date(endDate);
  }

  const take = Math.min(Math.max(Number(limit) || 50, 1), 500);

  return await prisma.sensorReading.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take,
    include: {
      sensor: {
        select: {
          id: true,
          hardwareId: true,
          sensorType: true,
          farmId: true,
        },
      },
    },
  });
}

// Get latest telemetry reading for a sensor device
async function getLatestSensorReading(idOrHardwareId) {
  if (!idOrHardwareId) {
    throw new BadRequestError('Sensor ID or Hardware ID is required');
  }

  const sensor = await prisma.sensor.findFirst({
    where: {
      OR: [{ id: idOrHardwareId }, { hardwareId: idOrHardwareId }],
    },
  });

  if (!sensor) {
    throw new NotFoundError(`Sensor with identifier '${idOrHardwareId}' not found`);
  }

  return await prisma.sensorReading.findFirst({
    where: { sensorId: sensor.id },
    orderBy: { recordedAt: 'desc' },
    include: {
      sensor: {
        select: {
          id: true,
          hardwareId: true,
          sensorType: true,
          farmId: true,
        },
      },
    },
  });
}

module.exports = {
  registerSensor,
  verifySensorToken,
  recordTelemetry,
  getSensorsByFarm,
  getSensorsByFarmer,
  getSensorById,
  updateSensor,
  claimSensor,
  syncFirebaseTelemetry,
  receiveFirebaseStream,
  getSensorTelemetry,
  getLatestSensorReading,
};

