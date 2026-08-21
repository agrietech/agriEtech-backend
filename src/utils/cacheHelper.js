const redis = require('../config/redis');
const logger = require('./logger');

/**
 * Cache Helper for improving API response times
 */
class CacheHelper {
  constructor() {
    this.defaultTTL = 300; // 5 minutes
    this.isRedisAvailable = redis && typeof redis.get === 'function';
  }

  /**
   * Get cached data
   */
  async get(key) {
    if (!this.isRedisAvailable) return null;

    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn(`[Cache] Get failed for key ${key}: ${err.message}`);
    }
    return null;
  }

  /**
   * Set cache data
   */
  async set(key, data, ttl = this.defaultTTL) {
    if (!this.isRedisAvailable) return false;

    try {
      await redis.setex(key, ttl, JSON.stringify(data));
      return true;
    } catch (err) {
      logger.warn(`[Cache] Set failed for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Delete cache key
   */
  async del(key) {
    if (!this.isRedisAvailable) return false;

    try {
      await redis.del(key);
      return true;
    } catch (err) {
      logger.warn(`[Cache] Delete failed for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Invalidate all keys matching pattern
   */
  async invalidatePattern(pattern) {
    if (!this.isRedisAvailable) return false;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (err) {
      logger.warn(`[Cache] Pattern invalidation failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Wrap a function with caching
   */
  async wrap(key, fn, ttl = this.defaultTTL) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}

module.exports = new CacheHelper();
