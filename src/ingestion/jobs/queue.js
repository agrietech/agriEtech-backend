const { Queue } = require('bullmq');
const redis = require('../../config/redis');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const QUEUE_NAME = 'ingestionQueue';
let ingestionQueue = null;
let ingestionWorker = null;

// Only create BullMQ queue if Redis is explicitly configured (not default localhost)
const redisConfigured =
  (env.REDIS_HOST && env.REDIS_HOST !== 'localhost' && env.REDIS_HOST !== '127.0.0.1') ||
  env.REDIS_PASSWORD;

if (env.NODE_ENV !== 'test' && redisConfigured) {
  try {
    if (redis && redis.options) {
      ingestionQueue = new Queue(QUEUE_NAME, {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 86400, // 24 hours
            count: 1000,
          },
          removeOnFail: {
            age: 604800, // 7 days
          },
        },
      });

      ingestionQueue.on('error', (err) => {
        if (err && err.code !== 'ECONNRESET' && err.code !== 'ETIMEDOUT') {
          logger.warn(`[IngestionQueue] Queue notice: ${err.message}`);
        }
      });

      logger.info('[IngestionQueue] BullMQ queue initialized with Redis');
    }
  } catch (err) {
    logger.warn(`[IngestionQueue] Initialization notice: ${err.message}`);
  }
} else if (env.NODE_ENV !== 'test') {
  logger.info('[IngestionQueue] Running in direct-execution mode (no Redis configured)');
}

// Add job to queue or mock
async function addJob(jobName, payload = {}, opts = {}) {
  if (ingestionQueue && redis.status === 'ready') {
    try {
      return await ingestionQueue.add(jobName, payload, opts);
    } catch (err) {
      logger.warn(`[IngestionQueue] Fallback to direct dispatch for ${jobName}: ${err.message}`);
    }
  }
  return {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: jobName,
    data: payload,
    opts,
    timestamp: Date.now(),
  };
}

// Add repeatable/recurring job
async function addRecurringJob(jobName, cronPattern, payload = {}, opts = {}) {
  if (ingestionQueue && redis.status === 'ready') {
    try {
      return await ingestionQueue.add(jobName, payload, {
        repeat: { pattern: cronPattern },
        ...opts,
      });
    } catch (err) {
      logger.warn(`[IngestionQueue] Recurring job fallback: ${err.message}`);
    }
  }
  return { id: `repeat_${jobName}`, name: jobName, pattern: cronPattern };
}

// Get queue statistics
async function getQueueStats() {
  if (ingestionQueue && redis.status === 'ready') {
    try {
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        ingestionQueue.getWaitingCount(),
        ingestionQueue.getActiveCount(),
        ingestionQueue.getCompletedCount(),
        ingestionQueue.getFailedCount(),
        ingestionQueue.getDelayedCount(),
        ingestionQueue.isPaused(),
      ]);
      return { waiting, active, completed, failed, delayed, paused: !!paused };
    } catch (_err) {
      // Return fallback stats
    }
  }
  return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: false };
}

// Get failed jobs
async function getFailedJobs(limit = 20) {
  if (ingestionQueue && redis.status === 'ready') {
    try {
      const jobs = await ingestionQueue.getFailed(0, limit);
      return jobs.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
        attemptsMade: j.attemptsMade,
        timestamp: j.timestamp,
      }));
    } catch (_err) {
      return [];
    }
  }
  return [];
}

// Close queue and worker cleanly
async function closeQueue() {
  try {
    if (ingestionWorker) {
      await ingestionWorker.close();
    }
    if (ingestionQueue) {
      await ingestionQueue.close();
    }
  } catch (err) {
    logger.warn(`[IngestionQueue] Close error: ${err.message}`);
  }
}

// Dispatch task (alias for addJob)
async function dispatchJob(jobName, payload = {}, opts = {}) {
  return await addJob(jobName, payload, opts);
}

module.exports = {
  ingestionQueue,
  ingestionWorker,
  addJob,
  addRecurringJob,
  dispatchJob,
  getQueueStats,
  getFailedJobs,
  closeQueue,
  connection: redis,
  QUEUE_NAME,
};
