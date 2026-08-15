const cron = require('node-cron');
const logger = require('../../utils/logger');
const { dispatchJob } = require('./queue');

// Register recurring cron schedules for data ingestion
function initScheduler() {
  // Hourly Open-Meteo weather update
  cron.schedule('0 * * * *', async () => {
    await dispatchJob('pullOpenMeteoHourly');
  });

  // Daily CHIRPS rainfall ingestion at 03:00 UTC
  cron.schedule('0 3 * * *', async () => {
    await dispatchJob('pullChirpsDaily');
  });

  // Daily GloFAS river discharge ingestion at 04:00 UTC
  cron.schedule('0 4 * * *', async () => {
    await dispatchJob('pullGlofasDaily');
  });

  // Daily FAO Locust bulletin check at 06:00 UTC
  cron.schedule('0 6 * * *', async () => {
    await dispatchJob('pullFaoLocustDaily');
  });

  logger.info('Ingestion schedulers registered');
}

module.exports = {
  initScheduler,
};
