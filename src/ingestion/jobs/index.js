/**
 * Job Queue System Index
 * Exports all job queue related functionality
 */

const { initScheduler, getScheduler } = require('./scheduler');
const { createWorker } = require('./workers');
const jobManager = require('./jobManager');
const { ingestionQueue, addJob, addRecurringJob, getQueueStats, closeQueue } = require('./queue');

module.exports = {
  // Scheduler
  initScheduler,
  getScheduler,

  // Worker
  createWorker,

  // Job Manager
  jobManager,

  // Queue functions
  ingestionQueue,
  addJob,
  addRecurringJob,
  getQueueStats,
  closeQueue,
};
