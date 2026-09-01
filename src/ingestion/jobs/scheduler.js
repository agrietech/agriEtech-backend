const cron = require('node-cron');
const logger = require('../../utils/logger');
const redis = require('../../config/redis');
const { dispatchJob } = require('./queue');

// Map scheduler job names to worker processors for direct execution fallback
function getJobProcessor(jobName) {
  try {
    const { jobProcessors } = require('./workers');
    const mapping = {
      pullOpenMeteoHourly: jobProcessors.pullWeatherForecast,
      pullChirpsDaily: jobProcessors.pullChirpsRainfall,
      pullGlofasDaily: jobProcessors.pullGlofasRiverDischarge,
      pullFaoLocustDaily: jobProcessors.pullFaoLocust,
      pullNasaPowerDaily: jobProcessors.pullNasaPower,
    };
    return mapping[jobName] || null;
  } catch (_err) {
    return null;
  }
}

/**
 * Execute job via BullMQ if Redis is active, or run directly in-process as fallback
 */
async function runScheduledJob(jobName, payload = {}) {
  const isRedisReady = redis && typeof redis.isConnected === 'function' && redis.isConnected();

  if (isRedisReady) {
    try {
      await dispatchJob(jobName, payload);
      logger.info(`[Scheduler] Queued job '${jobName}' to BullMQ`);
      return;
    } catch (queueErr) {
      logger.warn(`[Scheduler] BullMQ dispatch failed for '${jobName}': ${queueErr.message}. Executing directly.`);
    }
  }

  // Direct execution fallback
  const processor = getJobProcessor(jobName);
  if (processor) {
    logger.info(`[Scheduler] Running '${jobName}' in direct-execution mode (Redis unavailable)`);
    try {
      const mockJob = {
        id: `direct_${Date.now()}`,
        name: jobName,
        data: payload,
        updateProgress: async () => {},
      };
      await processor(mockJob);
      logger.info(`[Scheduler] Direct execution of '${jobName}' completed successfully`);
    } catch (procErr) {
      logger.error(`[Scheduler] Direct execution of '${jobName}' error: ${procErr.message}`);
    }
  } else {
    logger.debug(`[Scheduler] Dispatched mock task '${jobName}'`);
  }
}

// Register recurring cron schedules for data ingestion
function initScheduler() {
  // Hourly Open-Meteo weather update
  cron.schedule('0 * * * *', async () => {
    await runScheduledJob('pullOpenMeteoHourly');
  });

  // Daily CHIRPS rainfall ingestion at 03:00 UTC
  cron.schedule('0 3 * * *', async () => {
    await runScheduledJob('pullChirpsDaily');
  });

  // Daily GloFAS river discharge ingestion at 04:00 UTC
  cron.schedule('0 4 * * *', async () => {
    await runScheduledJob('pullGlofasDaily');
  });

  // Daily FAO Locust bulletin check at 06:00 UTC
  cron.schedule('0 6 * * *', async () => {
    await runScheduledJob('pullFaoLocustDaily');
  });

  logger.info('[Scheduler] Ingestion schedulers registered (Redis + direct fallback mode enabled)');
}

module.exports = {
  initScheduler,
  runScheduledJob,
};

