const cacheManager = require('../utils/cacheManager');
const logger = require('../utils/logger');

/**
 * Cache Middleware
 * Provides route-level caching capabilities
 */

/**
 * Cache response middleware
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Function to generate cache key from request
 */
function cacheResponse(ttl = 3600, keyGenerator = null) {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : `route:${req.originalUrl}`;

      // Try to get from cache
      const cached = await cacheManager.get(cacheKey);

      if (cached) {
        logger.debug('Cache hit', { cacheKey });
        return res.json(cached);
      }

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheManager.set(cacheKey, body, ttl).catch((err) => {
            logger.error('Failed to cache response', {
              cacheKey,
              error: err.message,
            });
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next(); // Continue without caching on error
    }
  };
}

/**
 * Invalidate cache middleware
 * Call after mutations to invalidate related caches
 */
function invalidateCache(patterns = []) {
  return async (req, res, next) => {
    // Store original send method
    const originalSend = res.send.bind(res);

    res.send = async function (body) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          try {
            const count = await cacheManager.deletePattern(pattern);
            logger.debug('Cache invalidated', { pattern, count });
          } catch (error) {
            logger.error('Failed to invalidate cache', {
              pattern,
              error: error.message,
            });
          }
        }
      }

      return originalSend(body);
    };

    next();
  };
}

/**
 * Cache key generators
 */
const cacheKeyGenerators = {
  /**
   * Generate key for risk assessment by woreda
   */
  riskByWoreda: (req) => {
    const { woredaId } = req.params;
    const { date, hazardType } = req.query;
    return cacheManager.riskKey(
      woredaId,
      date || new Date().toISOString().split('T')[0],
      hazardType || 'ALL'
    );
  },

  /**
   * Generate key for weather forecast
   */
  weatherForecast: (req) => {
    const { lat, lng } = req.query;
    const days = req.query.days || 7;
    return cacheManager.weatherKey(lat, lng, days);
  },

  /**
   * Generate key for boundary data
   */
  boundaryData: (req) => {
    const { type, id } = req.params;
    return cacheManager.boundaryKey(type, id);
  },

  /**
   * Generate key for farm data
   */
  farmData: (req) => {
    const { farmId } = req.params;
    const userId = req.user?.id;
    return `farm:${farmId}:${userId}`;
  },

  /**
   * Generate key for analytics
   */
  analytics: (req) => {
    const { type, period } = req.query;
    return `analytics:${type}:${period}`;
  },
};

/**
 * Preset cache configurations
 */
const cachePresets = {
  // Short cache for frequently changing data
  short: cacheResponse(300), // 5 minutes

  // Medium cache for moderately stable data
  medium: cacheResponse(1800), // 30 minutes

  // Long cache for stable data
  long: cacheResponse(3600), // 1 hour

  // Very long cache for rarely changing data
  veryLong: cacheResponse(86400), // 24 hours

  // Risk assessments with custom key
  riskAssessment: cacheResponse(3600, cacheKeyGenerators.riskByWoreda),

  // Weather forecast with custom key
  weatherForecast: cacheResponse(1800, cacheKeyGenerators.weatherForecast),

  // Boundary data with custom key
  boundaryData: cacheResponse(86400, cacheKeyGenerators.boundaryData),

  // Farm data with custom key
  farmData: cacheResponse(600, cacheKeyGenerators.farmData),

  // Analytics with custom key
  analytics: cacheResponse(3600, cacheKeyGenerators.analytics),
};

/**
 * Cache invalidation patterns
 */
const invalidationPatterns = {
  risks: ['risk:*'],
  farms: ['farm:*'],
  alerts: ['alert:*'],
  boundaries: ['boundary:*'],
  analytics: ['analytics:*'],
  all: ['*'],
};

module.exports = {
  cacheResponse,
  invalidateCache,
  cacheKeyGenerators,
  cachePresets,
  invalidationPatterns,
};
