const { Queue } = require('bullmq');
const redis = require('../../config/redis');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const QUEUE_NAME = 'ingestionQueue';
const DIAGNOSIS_QUEUE_NAME = 'diagnosisQueue';
let ingestionQueue = null;
let ingestionWorker = null;
let diagnosisQueue = null;
let diagnosisWorker = null;

// In-memory fallback map for non-redis environments
const memoryDiagnosisJobs = new Map();

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

      diagnosisQueue = new Queue(DIAGNOSIS_QUEUE_NAME, {
        connection: redis,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 1500,
          },
          removeOnComplete: {
            age: 86400 * 3, // 3 days
            count: 5000,
          },
          removeOnFail: {
            age: 604800,
          },
        },
      });

      diagnosisQueue.on('error', (err) => {
        if (err && err.code !== 'ECONNRESET' && err.code !== 'ETIMEDOUT') {
          logger.warn(`[DiagnosisQueue] Queue notice: ${err.message}`);
        }
      });

      logger.info('[Queue] BullMQ queues (ingestion + diagnosis) initialized with Redis');
    }
  } catch (err) {
    logger.warn(`[Queue] Initialization notice: ${err.message}`);
  }
} else if (env.NODE_ENV !== 'test') {
  logger.info('[Queue] Running in direct-execution mode (no Redis configured)');
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

// Save diagnosis job state to Redis and local memory
async function setDiagnosisJobState(jobId, state) {
  memoryDiagnosisJobs.set(jobId, state);
  if (redis && redis.status === 'ready') {
    try {
      await redis.setex(`diagnosis:job:${jobId}`, 86400 * 3, JSON.stringify(state));
    } catch (err) {
      logger.warn(`[Queue] Failed to persist diagnosis job to Redis: ${err.message}`);
    }
  }
}

// Retrieve diagnosis job state from Redis or local memory
async function getDiagnosisJobState(jobId) {
  if (redis && redis.status === 'ready') {
    try {
      const cached = await redis.get(`diagnosis:job:${jobId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_err) {
      // Fall back to memory map
    }
  }
  return memoryDiagnosisJobs.get(jobId) || null;
}

// Close queue and worker cleanly
async function closeQueue() {
  try {
    if (ingestionWorker) {
      await ingestionWorker.close();
    }
    if (diagnosisWorker) {
      await diagnosisWorker.close();
    }
    if (ingestionQueue) {
      await ingestionQueue.close();
    }
    if (diagnosisQueue) {
      await diagnosisQueue.close();
    }
  } catch (err) {
    logger.warn(`[Queue] Close error: ${err.message}`);
  }
}

// Dispatch task (alias for addJob)
async function dispatchJob(jobName, payload = {}, opts = {}) {
  return await addJob(jobName, payload, opts);
}

module.exports = {
  ingestionQueue,
  ingestionWorker,
  diagnosisQueue,
  diagnosisWorker,
  addJob,
  addRecurringJob,
  dispatchJob,
  getQueueStats,
  getFailedJobs,
  setDiagnosisJobState,
  getDiagnosisJobState,
  closeQueue,
  connection: redis,
  QUEUE_NAME,
  DIAGNOSIS_QUEUE_NAME,
};

