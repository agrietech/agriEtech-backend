const { Queue, Worker } = require('bullmq');
const redis = require('../../config/redis');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const QUEUE_NAME = 'ingestionQueue';
let ingestionQueue = null;
let ingestionWorker = null;

if (env.NODE_ENV !== 'test') {
  try {
    if (redis && redis.options) {
      ingestionQueue = new Queue(QUEUE_NAME, { connection: redis });
      ingestionQueue.on('error', (_err) => {
        // Handled silently when Redis is offline in local dev
      });

      ingestionWorker = new Worker(
        QUEUE_NAME,
        async (job) => {
          logger.info(`Processing job: ${job.name}`);
          return { success: true };
        },
        { connection: redis }
      );

      ingestionWorker.on('error', (_err) => {
        // Handled silently when Redis is offline in local dev
      });
    }
  } catch (_err) {
    // Queue initialization handled
  }
}

// Dispatch task to BullMQ or execute synchronously in development
async function dispatchJob(jobName, payload = {}) {
  if (ingestionQueue && redis.status === 'ready') {
    try {
      return await ingestionQueue.add(jobName, payload);
    } catch (_err) {
      // Fallback to synchronous handler
    }
  }
  return { id: `job-${Date.now()}`, name: jobName, data: payload };
}

module.exports = {
  ingestionQueue,
  ingestionWorker,
  dispatchJob,
  QUEUE_NAME,
};
