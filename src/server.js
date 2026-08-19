const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { initScheduler } = require('./ingestion/jobs/scheduler');
const { closeQueue } = require('./ingestion/jobs/queue');
const redis = require('./config/redis');

const server = http.createServer(app);
const PORT = env.PORT || 5000;

// Start HTTP server
server.listen(PORT, () => {
  logger.info(`[AgriEtech] Server running on port ${PORT} [${env.NODE_ENV}]`);
});

// Initialize background services
(async () => {
  try {
    initSocket(server);
    await connectDB();
    if (env.NODE_ENV !== 'test') {
      initScheduler();
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
  logger.info(`[AgriEtech] Received ${signal}. Initiating graceful shutdown...`);

  // Force shutdown after 15 seconds if drain hangs
  const forceTimeout = setTimeout(() => {
    logger.error('[AgriEtech] Forcefully terminating process after shutdown timeout');
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
    logger.info('[AgriEtech] HTTP server closed');

    // 2. Close BullMQ queues & workers
    await closeQueue();
    logger.info('[AgriEtech] Ingestion queues closed');

    // 3. Disconnect Redis
    if (redis && redis.status === 'ready') {
      await redis.quit().catch(() => {});
      logger.info('[AgriEtech] Redis disconnected');
    }

    // 4. Disconnect Prisma DB
    await disconnectDB();
    logger.info('[AgriEtech] Database disconnected');

    logger.info('[AgriEtech] Graceful shutdown completed cleanly');
    process.exit(0);
  } catch (error) {
    logger.error(`[AgriEtech] Error during graceful shutdown: ${error.message}`);
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
