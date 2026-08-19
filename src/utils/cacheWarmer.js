const cacheManager = require('./cacheManager');
const logger = require('./logger');
const { prisma, isConnected } = require('../config/db');

/**
 * Cache Warmer
 * Pre-populates cache with frequently accessed data
 */
class CacheWarmer {
  /**
   * Warm all caches
   */
  async warmAll() {
    logger.info('Starting cache warming...');
    const startTime = Date.now();

    try {
      await Promise.allSettled([
        this.warmBoundaries(),
        this.warmRecentRisks(),
        this.warmPopularWoredas(),
      ]);

      const duration = Date.now() - startTime;
      logger.info('Cache warming completed', { duration });
    } catch (error) {
      logger.error('Cache warming failed', { error: error.message });
    }
  }

  /**
   * Warm boundary data (regions, zones, woredas)
   */
  async warmBoundaries() {
    if (!isConnected()) {
      logger.warn('Database not connected, skipping boundary warming');
      return;
    }

    try {
      logger.info('Warming boundary data cache...');

      // Cache all regions
      const regions = await prisma.region.findMany({
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      await cacheManager.set('boundary:regions:all', regions, 86400);

      // Cache all zones
      const zones = await prisma.zone.findMany({
        select: {
          id: true,
          regionId: true,
          name: true,
        },
      });

      await cacheManager.set('boundary:zones:all', zones, 86400);

      // Cache woreda summary
      const woredas = await prisma.woreda.findMany({
        select: {
          id: true,
          zoneId: true,
          name: true,
          centerLat: true,
          centerLng: true,
        },
        take: 100, // Top 100 woredas
      });

      await cacheManager.set('boundary:woredas:summary', woredas, 86400);

      logger.info('Boundary data cache warmed', {
        regions: regions.length,
        zones: zones.length,
        woredas: woredas.length,
      });
    } catch (error) {
      logger.error('Failed to warm boundary cache', { error: error.message });
    }
  }

  /**
   * Warm recent risk assessments
   */
  async warmRecentRisks() {
    if (!isConnected()) {
      logger.warn('Database not connected, skipping risk warming');
      return;
    }

    try {
      logger.info('Warming risk assessment cache...');

      // Get risk assessments from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentRisks = await prisma.riskAssessment.findMany({
        where: {
          assessmentDate: {
            gte: yesterday,
          },
        },
        include: {
          woreda: {
            select: {
              id: true,
              name: true,
              centerLat: true,
              centerLng: true,
            },
          },
        },
        orderBy: {
          assessmentDate: 'desc',
        },
        take: 500,
      });

      // Cache by woreda
      const woredaMap = new Map();
      for (const risk of recentRisks) {
        if (!woredaMap.has(risk.woredaId)) {
          woredaMap.set(risk.woredaId, []);
        }
        woredaMap.get(risk.woredaId).push(risk);
      }

      for (const [woredaId, risks] of woredaMap) {
        const dateStr = new Date().toISOString().split('T')[0];
        const cacheKey = cacheManager.riskKey(woredaId, dateStr, 'ALL');
        await cacheManager.set(cacheKey, risks[0], 3600); // Latest risk
      }

      // Cache overall recent risks
      await cacheManager.set('risk:latest:all:20', recentRisks.slice(0, 20), 1800);

      logger.info('Risk assessment cache warmed', {
        risks: recentRisks.length,
        woredas: woredaMap.size,
      });
    } catch (error) {
      logger.error('Failed to warm risk cache', { error: error.message });
    }
  }

  /**
   * Warm popular woreda data
   */
  async warmPopularWoredas() {
    if (!isConnected()) {
      logger.warn('Database not connected, skipping woreda warming');
      return;
    }

    try {
      logger.info('Warming popular woreda cache...');

      // Get woredas with most farms (indicates active usage)
      const popularWoredas = await prisma.woreda.findMany({
        select: {
          id: true,
          name: true,
          centerLat: true,
          centerLng: true,
          geojson: true,
          _count: {
            select: {
              farms: true,
            },
          },
        },
        orderBy: {
          farms: {
            _count: 'desc',
          },
        },
        take: 50,
      });

      for (const woreda of popularWoredas) {
        const cacheKey = cacheManager.boundaryKey('woreda', woreda.id);
        await cacheManager.set(cacheKey, woreda, 86400);
      }

      logger.info('Popular woreda cache warmed', {
        woredas: popularWoredas.length,
      });
    } catch (error) {
      logger.error('Failed to warm woreda cache', { error: error.message });
    }
  }

  /**
   * Warm cache for specific woreda
   */
  async warmWoreda(woredaId) {
    if (!isConnected()) {
      return;
    }

    try {
      // Cache woreda details
      const woreda = await prisma.woreda.findUnique({
        where: { id: woredaId },
        include: {
          zone: {
            select: {
              id: true,
              name: true,
              regionId: true,
            },
          },
        },
      });

      if (woreda) {
        const cacheKey = cacheManager.boundaryKey('woreda', woredaId);
        await cacheManager.set(cacheKey, woreda, 86400);
      }

      // Cache latest risk assessment
      const latestRisk = await prisma.riskAssessment.findFirst({
        where: { woredaId },
        orderBy: { assessmentDate: 'desc' },
      });

      if (latestRisk) {
        const dateStr = new Date().toISOString().split('T')[0];
        const cacheKey = cacheManager.riskKey(woredaId, dateStr, 'ALL');
        await cacheManager.set(cacheKey, latestRisk, 3600);
      }

      logger.debug('Woreda cache warmed', { woredaId });
    } catch (error) {
      logger.error('Failed to warm woreda cache', {
        woredaId,
        error: error.message,
      });
    }
  }

  /**
   * Clear all application caches
   */
  async clearAll() {
    try {
      logger.info('Clearing all caches...');
      await cacheManager.deletePattern('*');
      logger.info('All caches cleared');
    } catch (error) {
      logger.error('Failed to clear caches', { error: error.message });
    }
  }
}

// Create singleton instance
const cacheWarmer = new CacheWarmer();

module.exports = cacheWarmer;
