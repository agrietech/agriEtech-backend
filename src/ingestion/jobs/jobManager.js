const { addJob, getQueueStats, getFailedJobs, ingestionQueue } = require('./queue');
const logger = require('../../utils/logger');

/**
 * Job Manager
 * Provides interface for manual job triggering and monitoring
 */
class JobManager {
  /**
   * Trigger CHIRPS rainfall ingestion
   */
  async triggerChirpsIngestion() {
    try {
      logger.info('Manually triggering CHIRPS ingestion');
      const job = await addJob(
        'pullChirpsRainfall',
        {},
        {
          priority: 1,
          attempts: 3,
        }
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to trigger CHIRPS ingestion', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger weather forecast ingestion
   */
  async triggerWeatherIngestion() {
    try {
      logger.info('Manually triggering weather forecast ingestion');
      const job = await addJob(
        'pullWeatherForecast',
        {},
        {
          priority: 1,
          attempts: 2,
        }
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to trigger weather ingestion', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger NASA POWER ingestion
   */
  async triggerNasaPowerIngestion() {
    try {
      logger.info('Manually triggering NASA POWER ingestion');
      const job = await addJob(
        'pullNasaPower',
        {},
        {
          priority: 2,
          attempts: 3,
        }
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to trigger NASA POWER ingestion', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger FAO Locust ingestion
   */
  async triggerLocustIngestion() {
    try {
      logger.info('Manually triggering FAO Locust ingestion');
      const job = await addJob(
        'pullFaoLocust',
        {},
        {
          priority: 1,
          attempts: 3,
        }
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to trigger locust ingestion', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger NDVI ingestion for specific woredas
   */
  async triggerNdviIngestion(woredaIds = null) {
    try {
      logger.info('Manually triggering NDVI ingestion', { woredaIds });
      const job = await addJob(
        'pullNdviData',
        { woredaIds },
        {
          priority: 2,
          attempts: 2,
        }
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to trigger NDVI ingestion', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger risk calculation
   */
  async triggerRiskCalculation(woredaIds = null) {
    try {
      logger.info('Manually triggering risk calculation', { woredaIds });
      const job = await addJob(
        'calculateRisks',
        { woredaIds },
        {
          priority: 1,
          attempts: 2,
        }
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to trigger risk calculation', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger data cleanup
   */
  async triggerDataCleanup() {
    try {
      logger.info('Manually triggering data cleanup');
      const job = await addJob(
        'cleanupOldData',
        {},
        {
          priority: 5,
          attempts: 1,
        }
      );
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to trigger data cleanup', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    try {
      const stats = await getQueueStats();
      return { success: true, stats };
    } catch (error) {
      logger.error('Failed to get queue stats', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(limit = 20) {
    try {
      const jobs = await getFailedJobs(limit);
      return { success: true, jobs };
    } catch (error) {
      logger.error('Failed to get failed jobs', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    try {
      if (!ingestionQueue) {
        throw new Error('Queue not initialized');
      }

      const job = await ingestionQueue.getJob(jobId);

      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      return {
        success: true,
        job: {
          id: job.id,
          name: job.name,
          data: job.data,
          progress: await job.getProgress(),
          state: await job.getState(),
          attemptsMade: job.attemptsMade,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
        },
      };
    } catch (error) {
      logger.error('Failed to get job', { jobId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId) {
    try {
      if (!ingestionQueue) {
        throw new Error('Queue not initialized');
      }

      const job = await ingestionQueue.getJob(jobId);

      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      await job.retry();
      logger.info('Job retry scheduled', { jobId });

      return { success: true, message: 'Job scheduled for retry' };
    } catch (error) {
      logger.error('Failed to retry job', { jobId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove job
   */
  async removeJob(jobId) {
    try {
      if (!ingestionQueue) {
        throw new Error('Queue not initialized');
      }

      const job = await ingestionQueue.getJob(jobId);

      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      await job.remove();
      logger.info('Job removed', { jobId });

      return { success: true, message: 'Job removed' };
    } catch (error) {
      logger.error('Failed to remove job', { jobId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue() {
    try {
      if (!ingestionQueue) {
        throw new Error('Queue not initialized');
      }

      await ingestionQueue.pause();
      logger.info('Queue paused');

      return { success: true, message: 'Queue paused' };
    } catch (error) {
      logger.error('Failed to pause queue', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue() {
    try {
      if (!ingestionQueue) {
        throw new Error('Queue not initialized');
      }

      await ingestionQueue.resume();
      logger.info('Queue resumed');

      return { success: true, message: 'Queue resumed' };
    } catch (error) {
      logger.error('Failed to resume queue', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const jobManager = new JobManager();

module.exports = jobManager;
