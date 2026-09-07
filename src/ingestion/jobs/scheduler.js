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
      const directJob = {
        id: `direct_${Date.now()}`,
        name: jobName,
        data: payload,
        updateProgress: async () => {},
      };
      await processor(directJob);
      logger.info(`[Scheduler] Direct execution of '${jobName}' completed successfully`);
    } catch (procErr) {
      logger.error(`[Scheduler] Direct execution of '${jobName}' error: ${procErr.message}`);
    }
  } else {
    logger.debug(`[Scheduler] Dispatched direct background task '${jobName}'`);
  }
}

const activeTasks = [];

// Register recurring cron schedules for data ingestion
function initScheduler() {
  stopScheduler(); // Avoid duplicate schedules on re-initialization

  // Hourly Open-Meteo weather update
  const t1 = cron.schedule('0 * * * *', async () => {
    await runScheduledJob('pullOpenMeteoHourly');
  });
  activeTasks.push({ name: 'pullOpenMeteoHourly', schedule: '0 * * * *', task: t1 });

  // Daily CHIRPS rainfall ingestion at 03:00 UTC
  const t2 = cron.schedule('0 3 * * *', async () => {
    await runScheduledJob('pullChirpsDaily');
  });
  activeTasks.push({ name: 'pullChirpsDaily', schedule: '0 3 * * *', task: t2 });

  // Daily GloFAS river discharge ingestion at 04:00 UTC
  const t3 = cron.schedule('0 4 * * *', async () => {
    await runScheduledJob('pullGlofasDaily');
  });
  activeTasks.push({ name: 'pullGlofasDaily', schedule: '0 4 * * *', task: t3 });

  // Daily FAO Locust bulletin check at 06:00 UTC
  const t4 = cron.schedule('0 6 * * *', async () => {
    await runScheduledJob('pullFaoLocustDaily');
  });
  activeTasks.push({ name: 'pullFaoLocustDaily', schedule: '0 6 * * *', task: t4 });

  logger.info(`[Scheduler] Ingestion schedulers registered (${activeTasks.length} active cron tasks)`);
}

function getScheduler() {
  return {
    isRunning: activeTasks.length > 0,
    taskCount: activeTasks.length,
    tasks: activeTasks.map((t) => ({ name: t.name, schedule: t.schedule })),
    runScheduledJob,
  };
}

function stopScheduler() {
  while (activeTasks.length > 0) {
    const item = activeTasks.pop();
    if (item && item.task && typeof item.task.stop === 'function') {
      item.task.stop();
    }
  }
}

module.exports = {
  initScheduler,
  getScheduler,
  stopScheduler,
  runScheduledJob,
};


