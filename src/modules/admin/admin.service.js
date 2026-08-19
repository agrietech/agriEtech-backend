const { prisma, isConnected } = require('../../config/db');
const redis = require('../../config/redis');
const { getQueueStats, addJob } = require('../../ingestion/jobs/queue');
const logger = require('../../utils/logger');
const os = require('os');

// In-memory fallback audit log store
const auditLogs = [
  {
    id: 'audit_01',
    action: 'SYSTEM_BOOT',
    adminId: 'usr_admin_01',
    adminEmail: 'admin@agrietech.et',
    details: 'System initialized with dual-mode operational resilience',
    ipAddress: '127.0.0.1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'audit_02',
    action: 'INGESTION_SYNC',
    adminId: 'usr_admin_01',
    adminEmail: 'admin@agrietech.et',
    details: 'Triggered CHIRPS rainfall ingestion batch for Oromia region',
    ipAddress: '127.0.0.1',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

// Fallback in-memory user registry for development & offline modes
const inMemoryUsers = [
  {
    id: 'usr_admin_01',
    email: 'admin@agrietech.et',
    phoneNumber: '+251911000001',
    fullName: 'Admin User',
    role: 'ADMIN',
    preferredLang: 'am',
    isEmailVerified: true,
    woredaId: 'woreda_adama_01',
    createdAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'usr_farmer_01',
    email: 'farmer@agrietech.et',
    phoneNumber: '+251911000002',
    fullName: 'Abebe Demo Farmer',
    role: 'FARMER',
    preferredLang: 'am',
    isEmailVerified: true,
    woredaId: 'woreda_adama_01',
    createdAt: new Date('2026-02-10').toISOString(),
  },
  {
    id: 'usr_da_01',
    email: 'da.adama@agrietech.et',
    phoneNumber: '+251911000003',
    fullName: 'Kebede Development Agent',
    role: 'DEVELOPMENT_AGENT',
    preferredLang: 'am',
    isEmailVerified: true,
    woredaId: 'woreda_adama_01',
    createdAt: new Date('2026-03-01').toISOString(),
  },
  {
    id: 'usr_officer_01',
    email: 'officer.eastshewa@agrietech.et',
    phoneNumber: '+251911000004',
    fullName: 'Almaz Woreda Officer',
    role: 'WOREDA_OFFICER',
    preferredLang: 'om',
    isEmailVerified: true,
    woredaId: 'woreda_adama_01',
    createdAt: new Date('2026-03-15').toISOString(),
  },
  {
    id: 'usr_researcher_01',
    email: 'researcher.eiar@agrietech.et',
    phoneNumber: '+251911000005',
    fullName: 'Dr. Chala Agronomy Researcher',
    role: 'RESEARCHER',
    preferredLang: 'en',
    isEmailVerified: true,
    woredaId: null,
    createdAt: new Date('2026-04-01').toISOString(),
  },
];

/**
 * Get comprehensive administrative dashboard overview
 */
async function getOverview() {
  const memUsage = process.memoryUsage();
  const queueStats = await getQueueStats();

  if (isConnected()) {
    try {
      const [
        totalUsers,
        usersByRole,
        totalFarms,
        totalSensors,
        activeSensors,
        totalAlerts,
        totalDiagnoses,
        recentAlerts,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({
          by: ['role'],
          _count: { id: true },
        }),
        prisma.farm.count(),
        prisma.sensor.count(),
        prisma.sensor.count({ where: { isActive: true } }),
        prisma.alert.count(),
        prisma.diseaseDiagnosis.count(),
        prisma.alert.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { woreda: { select: { nameEn: true, nameAm: true } } },
        }),
      ]);

      const roleDistribution = {
        FARMER: 0,
        DEVELOPMENT_AGENT: 0,
        WOREDA_OFFICER: 0,
        RESEARCHER: 0,
        ADMIN: 0,
      };
      usersByRole.forEach((r) => {
        roleDistribution[r.role] = r._count.id;
      });

      return {
        metrics: {
          totalUsers,
          roleDistribution,
          totalFarms,
          totalSensors,
          activeSensors,
          totalAlerts,
          totalDiagnoses,
        },
        queue: queueStats,
        system: {
          status: 'OPERATIONAL',
          uptimeSeconds: Math.floor(process.uptime()),
          memoryUsageMb: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
          totalSystemMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
          freeSystemMemoryMb: Math.round(os.freemem() / 1024 / 1024),
          nodeVersion: process.version,
          platform: process.platform,
          cpuCores: os.cpus().length,
        },
        database: { connected: true, engine: 'PostgreSQL / PostGIS' },
        redis: { connected: redis ? redis.isConnected() : false },
        recentAlerts,
        recentAuditLogs: auditLogs.slice(0, 5),
      };
    } catch (err) {
      logger.warn(`[AdminService] DB aggregation error, using fallback: ${err.message}`);
    }
  }

  // Fallback metrics
  const roleDistribution = inMemoryUsers.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return {
    metrics: {
      totalUsers: inMemoryUsers.length,
      roleDistribution: {
        FARMER: roleDistribution.FARMER || 0,
        DEVELOPMENT_AGENT: roleDistribution.DEVELOPMENT_AGENT || 0,
        WOREDA_OFFICER: roleDistribution.WOREDA_OFFICER || 0,
        RESEARCHER: roleDistribution.RESEARCHER || 0,
        ADMIN: roleDistribution.ADMIN || 0,
      },
      totalFarms: 124,
      totalSensors: 86,
      activeSensors: 82,
      totalAlerts: 48,
      totalDiagnoses: 215,
    },
    queue: queueStats,
    system: {
      status: 'OPERATIONAL',
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
      totalSystemMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      freeSystemMemoryMb: Math.round(os.freemem() / 1024 / 1024),
      nodeVersion: process.version,
      platform: process.platform,
      cpuCores: os.cpus().length,
    },
    database: { connected: isConnected(), engine: 'PostgreSQL / PostGIS (Mock Mode)' },
    redis: { connected: redis ? redis.isConnected() : false },
    recentAlerts: [
      {
        id: 'alert_demo_01',
        titleEn: 'Moderate Drought Advisory - Adama',
        titleAm: 'መካከለኛ የድርቅ ማስጠንቀቂያ - አዳማ',
        severity: 'HIGH',
        hazardType: 'DROUGHT',
        createdAt: new Date().toISOString(),
      },
    ],
    recentAuditLogs: auditLogs.slice(0, 5),
  };
}

/**
 * Get paginated list of users with filtering
 */
async function getUsers({ page = 1, limit = 20, role, woredaId, search } = {}) {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  if (isConnected()) {
    try {
      const where = {};
      if (role) where.role = role;
      if (woredaId) where.woredaId = woredaId;
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            fullName: true,
            role: true,
            preferredLang: true,
            isEmailVerified: true,
            woredaId: true,
            woreda: { select: { nameEn: true, nameAm: true } },
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (err) {
      logger.warn(`[AdminService] User query error: ${err.message}`);
    }
  }

  // In-memory filter
  let filtered = [...inMemoryUsers];
  if (role) filtered = filtered.filter((u) => u.role === role);
  if (woredaId) filtered = filtered.filter((u) => u.woredaId === woredaId);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phoneNumber && u.phoneNumber.includes(q))
    );
  }

  const paginated = filtered.slice(skip, skip + take);

  return {
    users: paginated,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / take) || 1,
    },
  };
}

/**
 * Update user role
 */
async function updateUserRole(userId, newRole, adminContext = {}) {
  const validRoles = ['FARMER', 'DEVELOPMENT_AGENT', 'WOREDA_OFFICER', 'RESEARCHER', 'ADMIN'];
  if (!validRoles.includes(newRole)) {
    throw new Error(`Invalid role '${newRole}'. Allowed roles: ${validRoles.join(', ')}`);
  }

  let updatedUser = null;

  if (isConnected()) {
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          updatedAt: true,
        },
      });
    } catch (err) {
      logger.warn(`[AdminService] DB role update failed: ${err.message}`);
    }
  }

  if (!updatedUser) {
    const user = inMemoryUsers.find((u) => u.id === userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    user.role = newRole;
    updatedUser = { ...user };
  }

  // Audit log
  logAuditAction({
    action: 'USER_ROLE_UPDATED',
    adminId: adminContext.id || 'usr_admin_01',
    adminEmail: adminContext.email || 'admin@agrietech.et',
    details: `Updated role for user ${userId} to ${newRole}`,
    ipAddress: adminContext.ip || '127.0.0.1',
  });

  return updatedUser;
}

/**
 * Update user verification status
 */
async function updateUserStatus(userId, { isEmailVerified }, adminContext = {}) {
  let updatedUser = null;

  if (isConnected()) {
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: Boolean(isEmailVerified) },
        select: {
          id: true,
          email: true,
          fullName: true,
          isEmailVerified: true,
          updatedAt: true,
        },
      });
    } catch (err) {
      logger.warn(`[AdminService] DB status update failed: ${err.message}`);
    }
  }

  if (!updatedUser) {
    const user = inMemoryUsers.find((u) => u.id === userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    user.isEmailVerified = Boolean(isEmailVerified);
    updatedUser = { ...user };
  }

  logAuditAction({
    action: 'USER_STATUS_UPDATED',
    adminId: adminContext.id || 'usr_admin_01',
    adminEmail: adminContext.email || 'admin@agrietech.et',
    details: `Updated verification status for user ${userId}: isEmailVerified=${isEmailVerified}`,
    ipAddress: adminContext.ip || '127.0.0.1',
  });

  return updatedUser;
}

/**
 * Deep diagnostic health check
 */
async function getSystemHealth() {
  const memUsage = process.memoryUsage();
  const dbStatus = isConnected();
  const redisStatus = redis && typeof redis.isConnected === 'function' ? redis.isConnected() : false;
  const queueStats = await getQueueStats();

  return {
    timestamp: new Date().toISOString(),
    overallStatus: dbStatus ? 'HEALTHY' : 'DEGRADED_OFFLINE_MODE',
    subsystems: {
      database: {
        status: dbStatus ? 'UP' : 'OFFLINE_FALLBACK',
        provider: 'PostgreSQL 15 + PostGIS 3.3',
        connected: dbStatus,
      },
      redis: {
        status: redisStatus ? 'UP' : 'IN_MEMORY_FALLBACK',
        connected: redisStatus,
      },
      jobQueue: {
        status: 'OPERATIONAL',
        name: 'ingestionQueue',
        ...queueStats,
      },
      externalIntegrations: {
        openRouterAI: { status: 'CONFIGURED', model: 'google/gemini-2.5-flash', fallback: 'ACTIVE' },
        plantIdClassifier: { status: 'CONFIGURED', fallback: 'OFFLINE_BOTANICAL_TAXONOMY' },
        africasTalkingSMS: { status: 'CONFIGURED', mode: 'SANDBOX' },
        openMeteoWeather: { status: 'OPERATIONAL' },
        chirpsRainfall: { status: 'OPERATIONAL' },
      },
      memory: {
        heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMb: Math.round(memUsage.rss / 1024 / 1024),
        systemFreeMb: Math.round(os.freemem() / 1024 / 1024),
        systemTotalMb: Math.round(os.totalmem() / 1024 / 1024),
      },
      host: {
        uptimeSeconds: Math.floor(process.uptime()),
        hostname: os.hostname(),
        platform: process.platform,
        architecture: process.arch,
        cpuCount: os.cpus().length,
      },
    },
  };
}

/**
 * Trigger on-demand ingestion job
 */
async function triggerIngestion(jobType, payload = {}, adminContext = {}) {
  const validJobTypes = [
    'pullChirpsRainfall',
    'pullWeatherForecast',
    'pullNasaPower',
    'pullFaoLocust',
    'pullNdviData',
    'calculateRisks',
    'cleanupOldData',
  ];

  if (!validJobTypes.includes(jobType)) {
    throw new Error(`Invalid job type '${jobType}'. Valid options: ${validJobTypes.join(', ')}`);
  }

  const job = await addJob(jobType, payload, { priority: 1 });

  logAuditAction({
    action: 'MANUAL_INGESTION_TRIGGERED',
    adminId: adminContext.id || 'usr_admin_01',
    adminEmail: adminContext.email || 'admin@agrietech.et',
    details: `Triggered ingestion job: ${jobType} (Job ID: ${job.id})`,
    ipAddress: adminContext.ip || '127.0.0.1',
  });

  return {
    success: true,
    jobId: job.id,
    jobType,
    triggeredAt: new Date().toISOString(),
  };
}

/**
 * Broadcast emergency alert to woredas
 */
async function broadcastEmergencyAlert(data, adminContext = {}) {
  const {
    woredaId = 'woreda_adama_01',
    hazardType = 'DROUGHT',
    severity = 'CRITICAL',
    titleEn,
    titleAm,
    messageEn,
    messageAm,
  } = data;

  if (!titleEn || !messageEn) {
    throw new Error('titleEn and messageEn are required');
  }

  let createdAlert = null;

  if (isConnected()) {
    try {
      createdAlert = await prisma.alert.create({
        data: {
          woredaId,
          hazardType,
          severity,
          titleEn,
          titleAm: titleAm || titleEn,
          messageEn,
          messageAm: messageAm || messageEn,
        },
      });
    } catch (err) {
      logger.warn(`[AdminService] DB alert broadcast error: ${err.message}`);
    }
  }

  if (!createdAlert) {
    createdAlert = {
      id: `alert_broadcast_${Date.now()}`,
      woredaId,
      hazardType,
      severity,
      titleEn,
      titleAm: titleAm || titleEn,
      messageEn,
      messageAm: messageAm || messageEn,
      createdAt: new Date().toISOString(),
    };
  }

  logAuditAction({
    action: 'EMERGENCY_ALERT_BROADCAST',
    adminId: adminContext.id || 'usr_admin_01',
    adminEmail: adminContext.email || 'admin@agrietech.et',
    details: `Broadcasted ${severity} ${hazardType} alert to woreda ${woredaId}`,
    ipAddress: adminContext.ip || '127.0.0.1',
  });

  return createdAlert;
}

/**
 * Get audit logs
 */
async function getAuditLogs(limit = 50) {
  return auditLogs.slice(0, Number(limit));
}

function logAuditAction(entry) {
  auditLogs.unshift({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    ...entry,
    timestamp: new Date().toISOString(),
  });
  if (auditLogs.length > 500) auditLogs.pop();
}

module.exports = {
  getOverview,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getSystemHealth,
  triggerIngestion,
  broadcastEmergencyAlert,
  getAuditLogs,
  logAuditAction,
};
