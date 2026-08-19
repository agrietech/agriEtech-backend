const { Worker } = require('bullmq');
const { connection, QUEUE_NAME } = require('./queue');
const logger = require('../../utils/logger');
const { prisma } = require('../../config/db');
const connectors = require('../connectors');

/**
 * Job Processors
 * Each processor handles a specific data ingestion task
 */
const jobProcessors = {
  /**
   * Pull CHIRPS rainfall data for all woredas
   */
  async pullChirpsRainfall(job) {
    logger.info('Processing CHIRPS rainfall ingestion', { jobId: job.id });

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    try {
      // Get all woredas
      const woredas = await prisma.woreda.findMany({
        select: {
          id: true,
          name: true,
          centerLat: true,
          centerLng: true,
        },
      });

      logger.info(`Fetching CHIRPS data for ${woredas.length} woredas`);

      // Process in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < woredas.length; i += batchSize) {
        const batch = woredas.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (woreda) => {
            try {
              const data = await connectors.chirpsConnector.fetchRainfallByLocation({
                lat: woreda.centerLat,
                lng: woreda.centerLng,
              });

              // Save to database
              await prisma.satelliteObservation.upsert({
                where: {
                  woredaId_observationDate_source: {
                    woredaId: woreda.id,
                    observationDate: new Date(),
                    source: 'CHIRPS',
                  },
                },
                update: {
                  chirpsRainfallMm: data.precipitationMm,
                  rawPayload: data,
                  ingestionStatus: 'SUCCESS',
                },
                create: {
                  woredaId: woreda.id,
                  observationDate: new Date(),
                  source: 'CHIRPS',
                  chirpsRainfallMm: data.precipitationMm,
                  rawPayload: data,
                  ingestionStatus: 'SUCCESS',
                },
              });

              successCount++;
            } catch (error) {
              logger.error('Failed to fetch CHIRPS for woreda', {
                woredaId: woreda.id,
                error: error.message,
              });
              errorCount++;
            }
          })
        );

        // Update job progress
        const progress = Math.round(((i + batch.length) / woredas.length) * 100);
        await job.updateProgress(progress);

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const duration = Date.now() - startTime;
      logger.info('CHIRPS ingestion completed', {
        jobId: job.id,
        duration,
        successCount,
        errorCount,
        totalWoredas: woredas.length,
      });

      return {
        success: true,
        successCount,
        errorCount,
        totalWoredas: woredas.length,
        duration,
      };
    } catch (error) {
      logger.error('CHIRPS ingestion failed', {
        jobId: job.id,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * Pull Open-Meteo weather forecast for all woredas
   */
  async pullWeatherForecast(job) {
    logger.info('Processing weather forecast ingestion', { jobId: job.id });

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    try {
      const woredas = await prisma.woreda.findMany({
        select: {
          id: true,
          name: true,
          centerLat: true,
          centerLng: true,
        },
      });

      logger.info(`Fetching weather forecast for ${woredas.length} woredas`);

      const batchSize = 15; // Open-Meteo is more generous
      for (let i = 0; i < woredas.length; i += batchSize) {
        const batch = woredas.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (woreda) => {
            try {
              const data = await connectors.openMeteoConnector.fetchForecast({
                lat: woreda.centerLat,
                lng: woreda.centerLng,
                days: 7,
              });

              // Save current day data
              if (data.daily && data.daily.time && data.daily.time.length > 0) {
                await prisma.satelliteObservation.upsert({
                  where: {
                    woredaId_observationDate_source: {
                      woredaId: woreda.id,
                      observationDate: new Date(),
                      source: 'OPEN_METEO',
                    },
                  },
                  update: {
                    nasaPowerTempMax: data.daily.temperature_2m_max[0],
                    nasaPowerTempMin: data.daily.temperature_2m_min[0],
                    nasaPowerHumidity: data.daily.relative_humidity_2m_mean[0],
                    rawPayload: data,
                    ingestionStatus: 'SUCCESS',
                  },
                  create: {
                    woredaId: woreda.id,
                    observationDate: new Date(),
                    source: 'OPEN_METEO',
                    nasaPowerTempMax: data.daily.temperature_2m_max[0],
                    nasaPowerTempMin: data.daily.temperature_2m_min[0],
                    nasaPowerHumidity: data.daily.relative_humidity_2m_mean[0],
                    rawPayload: data,
                    ingestionStatus: 'SUCCESS',
                  },
                });
              }

              successCount++;
            } catch (error) {
              logger.error('Failed to fetch weather for woreda', {
                woredaId: woreda.id,
                error: error.message,
              });
              errorCount++;
            }
          })
        );

        await job.updateProgress(Math.round(((i + batch.length) / woredas.length) * 100));
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const duration = Date.now() - startTime;
      logger.info('Weather forecast ingestion completed', {
        jobId: job.id,
        duration,
        successCount,
        errorCount,
      });

      return {
        success: true,
        successCount,
        errorCount,
        duration,
      };
    } catch (error) {
      logger.error('Weather forecast ingestion failed', {
        jobId: job.id,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * Pull NASA POWER agroclimatology data
   */
  async pullNasaPower(job) {
    logger.info('Processing NASA POWER ingestion', { jobId: job.id });

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    try {
      const woredas = await prisma.woreda.findMany({
        select: {
          id: true,
          name: true,
          centerLat: true,
          centerLng: true,
        },
      });

      const batchSize = 5; // NASA POWER is slower
      for (let i = 0; i < woredas.length; i += batchSize) {
        const batch = woredas.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (woreda) => {
            try {
              const data = await connectors.nasaPowerConnector.fetchDailySolarAndHumidity({
                lat: woreda.centerLat,
                lng: woreda.centerLng,
              });

              if (data.summary) {
                await prisma.satelliteObservation.upsert({
                  where: {
                    woredaId_observationDate_source: {
                      woredaId: woreda.id,
                      observationDate: new Date(),
                      source: 'NASA_POWER',
                    },
                  },
                  update: {
                    nasaPowerTempMax: data.summary.avgTempMax,
                    nasaPowerTempMin: data.summary.avgTempMin,
                    nasaPowerHumidity: data.summary.avgHumidity,
                    nasaPowerSolarMJ: data.summary.avgSolarRadiation,
                    rawPayload: data,
                    ingestionStatus: 'SUCCESS',
                  },
                  create: {
                    woredaId: woreda.id,
                    observationDate: new Date(),
                    source: 'NASA_POWER',
                    nasaPowerTempMax: data.summary.avgTempMax,
                    nasaPowerTempMin: data.summary.avgTempMin,
                    nasaPowerHumidity: data.summary.avgHumidity,
                    nasaPowerSolarMJ: data.summary.avgSolarRadiation,
                    rawPayload: data,
                    ingestionStatus: 'SUCCESS',
                  },
                });
              }

              successCount++;
            } catch (error) {
              logger.error('Failed to fetch NASA POWER for woreda', {
                woredaId: woreda.id,
                error: error.message,
              });
              errorCount++;
            }
          })
        );

        await job.updateProgress(Math.round(((i + batch.length) / woredas.length) * 100));
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const duration = Date.now() - startTime;
      logger.info('NASA POWER ingestion completed', {
        jobId: job.id,
        duration,
        successCount,
        errorCount,
      });

      return { success: true, successCount, errorCount, duration };
    } catch (error) {
      logger.error('NASA POWER ingestion failed', {
        jobId: job.id,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * Pull FAO Locust Watch bulletins
   */
  async pullFaoLocust(job) {
    logger.info('Processing FAO Locust ingestion', { jobId: job.id });

    try {
      const data = await connectors.faoLocustConnector.fetchLatestBulletins();

      if (data.activeThreats && data.activeThreats.length > 0) {
        // Store locust data for affected woredas
        for (const threat of data.activeThreats) {
          // Find nearby woredas (within 100km radius)
          const nearbyWoredas = await prisma.$queryRaw`
            SELECT id, name,
              ST_Distance(
                ST_SetSRID(ST_MakePoint(${threat.lng}, ${threat.lat}), 4326)::geography,
                ST_SetSRID(ST_MakePoint("centerLng", "centerLat"), 4326)::geography
              ) / 1000 as distance_km
            FROM "Woreda"
            WHERE ST_DWithin(
              ST_SetSRID(ST_MakePoint("centerLng", "centerLat"), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${threat.lng}, ${threat.lat}), 4326)::geography,
              100000
            )
            ORDER BY distance_km ASC
            LIMIT 20
          `;

          for (const woreda of nearbyWoredas) {
            await prisma.satelliteObservation.upsert({
              where: {
                woredaId_observationDate_source: {
                  woredaId: woreda.id,
                  observationDate: new Date(),
                  source: 'FAO_LOCUST',
                },
              },
              update: {
                locustPresence: true,
                locustDensity: threat.density,
                rawPayload: { threat, distance_km: woreda.distance_km },
                ingestionStatus: 'SUCCESS',
              },
              create: {
                woredaId: woreda.id,
                observationDate: new Date(),
                source: 'FAO_LOCUST',
                locustPresence: true,
                locustDensity: threat.density,
                rawPayload: { threat, distance_km: woreda.distance_km },
                ingestionStatus: 'SUCCESS',
              },
            });
          }
        }

        logger.info('FAO Locust ingestion completed', {
          jobId: job.id,
          threatsFound: data.activeThreats.length,
        });

        return {
          success: true,
          threatsFound: data.activeThreats.length,
          swarms: data.totalSwarms,
          hoppers: data.totalHoppers,
        };
      } else {
        logger.info('No active locust threats found', { jobId: job.id });
        return { success: true, threatsFound: 0 };
      }
    } catch (error) {
      logger.error('FAO Locust ingestion failed', {
        jobId: job.id,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * Pull NDVI data for sample woredas
   */
  async pullNdviData(job) {
    logger.info('Processing NDVI ingestion', { jobId: job.id });

    try {
      // NDVI is expensive, so we only pull for a sample or on-demand
      const sampleSize = job.data.woredaIds?.length || 50;

      let woredas;
      if (job.data.woredaIds) {
        woredas = await prisma.woreda.findMany({
          where: { id: { in: job.data.woredaIds } },
          select: {
            id: true,
            name: true,
            centerLat: true,
            centerLng: true,
            geojson: true,
          },
        });
      } else {
        // Sample random woredas
        woredas = await prisma.$queryRaw`
          SELECT id, name, "centerLat", "centerLng", geojson
          FROM "Woreda"
          ORDER BY RANDOM()
          LIMIT ${sampleSize}
        `;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const woreda of woredas) {
        try {
          const data = await connectors.ndviConnector.fetchNdviByPolygon({
            woredaId: woreda.id,
            polygon: woreda.geojson,
            date: new Date(),
          });

          await prisma.satelliteObservation.upsert({
            where: {
              woredaId_observationDate_source: {
                woredaId: woreda.id,
                observationDate: new Date(),
                source: 'MODIS_NDVI',
              },
            },
            update: {
              modisNdvi: data.meanNdvi,
              rawPayload: data,
              ingestionStatus: 'SUCCESS',
            },
            create: {
              woredaId: woreda.id,
              observationDate: new Date(),
              source: 'MODIS_NDVI',
              modisNdvi: data.meanNdvi,
              rawPayload: data,
              ingestionStatus: 'SUCCESS',
            },
          });

          successCount++;
        } catch (error) {
          logger.error('Failed to fetch NDVI for woreda', {
            woredaId: woreda.id,
            error: error.message,
          });
          errorCount++;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000)); // Slow rate for Sentinel Hub
      }

      logger.info('NDVI ingestion completed', {
        jobId: job.id,
        successCount,
        errorCount,
      });

      return { success: true, successCount, errorCount };
    } catch (error) {
      logger.error('NDVI ingestion failed', {
        jobId: job.id,
        error: error.message,
      });
      throw error;
    }
  },
};

/**
 * Create and start worker
 */
function createWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const processor = jobProcessors[job.name];

      if (!processor) {
        logger.error('Unknown job type', { jobName: job.name });
        throw new Error(`Unknown job type: ${job.name}`);
      }

      return await processor(job);
    },
    {
      connection,
      concurrency: 5, // Process 5 jobs concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // per minute
      },
    }
  );

  // Event handlers
  worker.on('completed', (job, result) => {
    logger.info('Job completed', {
      jobId: job.id,
      jobName: job.name,
      result,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Job failed', {
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on('error', (error) => {
    logger.error('Worker error', { error: error.message });
  });

  worker.on('stalled', (jobId) => {
    logger.warn('Job stalled', { jobId });
  });

  logger.info('BullMQ worker started', { queueName: QUEUE_NAME });

  return worker;
}

module.exports = {
  createWorker,
  jobProcessors,
};
