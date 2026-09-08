const dns = require('node:dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { initScheduler } = require('./ingestion/jobs/scheduler');
const { closeQueue } = require('./ingestion/jobs/queue');
const redis = require('./config/redis');

const { warmBoundariesCache } = require('./modules/boundaries/boundaries.service');

const server = http.createServer(app);
const PORT = env.PORT || 5000;

// Render Keep-Alive Pinger to eliminate free-tier sleep / cold starts
function initRenderKeepAlive() {
  const targetUrl = process.env.RENDER_EXTERNAL_URL || env.APP_URL || 'https://agrietech.onrender.com';
  if (!targetUrl || !targetUrl.includes('onrender.com')) return;

  const pingIntervalMs = 10 * 60 * 1000; // 10 minutes (Render sleeps after 15 mins)
  setInterval(() => {
    try {
      const https = require('https');
      https.get(`${targetUrl}/health`, (res) => {
        logger.debug(`[Render Keep-Alive] Ping ${targetUrl}/health -> HTTP ${res.statusCode}`);
      }).on('error', (err) => {
        logger.debug(`[Render Keep-Alive] Ping notice: ${err.message}`);
      });
    } catch (_e) {}
  }, pingIntervalMs).unref();

  logger.info(`[Render Keep-Alive] Keep-alive pinger scheduled for ${targetUrl} (every 10 min)`);
}

// Start HTTP server
server.listen(PORT, () => {
  logger.info(`[EthioFarm] Server running on port ${PORT} [${env.NODE_ENV}]`);
});

async function autoSyncAdminAccount() {
  try {
    const adminPassword = (process.env.ADMIN_CONSOLE_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ethiofarm.et').trim().toLowerCase();

    if (adminPassword) {
      const bcrypt = require('bcryptjs');
      const { prisma } = require('./config/db');

      const existing = await prisma.user.findFirst({
        where: { email: { equals: adminEmail, mode: 'insensitive' } },
      });

      const passwordHash = await bcrypt.hash(adminPassword, 10);
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: 'ADMIN', passwordHash, isEmailVerified: true },
        });
        logger.info(`[Admin Sync] Admin account (${adminEmail}) synchronized with environment configuration.`);
      } else {
        await prisma.user.create({
          data: {
            email: adminEmail,
            fullName: 'Platform Administrator',
            passwordHash,
            role: 'ADMIN',
            isEmailVerified: true,
            preferredLang: 'en',
          },
        });
        logger.info(`[Admin Sync] Created admin account (${adminEmail}) from environment configuration.`);
      }
    }
  } catch (err) {
    logger.warn(`[Admin Sync] Background sync notice: ${err.message}`);
  }
}

// Initialize background services
(async () => {
  try {
    initSocket(server);
    await connectDB();

    // Synchronize administrative user with environment credentials if configured
    autoSyncAdminAccount().catch((e) => logger.warn(`Admin sync notice: ${e.message}`));

    // Warm boundaries in memory for sub-millisecond response times
    warmBoundariesCache().catch((e) => logger.warn(`Cache warming notice: ${e.message}`));

    if (env.NODE_ENV !== 'test') {
      initScheduler();
      initRenderKeepAlive();
    }
  } catch (err) {
    logger.warn(`Service startup notice: ${err.message}`);
  }
})();

// Graceful Shutdown Handler
let isShuttingDown = false;
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`[EthioFarm] Received ${signal}. Initiating graceful shutdown...`);

  // Force shutdown after 15 seconds if drain hangs
  const forceTimeout = setTimeout(() => {
    logger.error('[EthioFarm] Forcefully terminating process after shutdown timeout');
    process.exit(1);
  }, 15000);
  forceTimeout.unref();

  try {
    // 1. Stop accepting new HTTP connections
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) logger.warn(`Error closing HTTP server: ${err.message}`);
        resolve();
      });
    });
    logger.info('[EthioFarm] HTTP server closed');

    // 2. Close BullMQ queues & workers
    await closeQueue();
    logger.info('[EthioFarm] Ingestion queues closed');

    // 3. Disconnect Redis
    if (redis && redis.status === 'ready') {
      await redis.quit().catch(() => {});
      logger.info('[EthioFarm] Redis disconnected');
    }

    // 4. Disconnect Prisma DB
    await disconnectDB();
    logger.info('[EthioFarm] Database disconnected');

    logger.info('[EthioFarm] Graceful shutdown completed cleanly');
    process.exit(0);
  } catch (error) {
    logger.error(`[EthioFarm] Error during graceful shutdown: ${error.message}`);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process error traps
process.on('uncaughtException', (err) => {
  logger.error(`[FATAL] Uncaught Exception: ${err.message}`, { stack: err.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[FATAL] Unhandled Rejection at:', { promise, reason });
});

module.exports = server;
