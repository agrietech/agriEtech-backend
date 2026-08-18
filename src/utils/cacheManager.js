const Redis = require('ioredis');
const logger = require('./logger');
const env = require('../config/env');

/**
 * Cache Manager with Redis
 * Provides caching utilities with TTL, compression, and automatic key generation
 */
class CacheManager {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.keyPrefix = env.REDIS_KEY_PREFIX || 'agrietech:';
    this.defaultTTL = 3600; // 1 hour in seconds
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.redis = new Redis({
        host: env.REDIS_HOST || 'localhost',
        port: parseInt(env.REDIS_PORT) || 6379,
        password: env.REDIS_PASSWORD || undefined,
        db: parseInt(env.REDIS_DB) || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: parseInt(env.REDIS_MAX_RETRIES) || 3,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis cache connected successfully');
      });

      this.redis.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis cache error', { error: err.message });
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis cache connection closed');
      });

      // Test connection
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis cache', { error: error.message });
      return false;
    }
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = null) {
    if (!this.isConnected) {
      logger.warn('Cache not connected, skipping set operation');
      return false;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const serialized = JSON.stringify(value);
      const expiryTime = ttl || this.defaultTTL;

      await this.redis.setex(fullKey, expiryTime, serialized);
      logger.debug(`Cache set: ${key} (TTL: ${expiryTime}s)`);
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get cache value
   * @param {string} key - Cache key
   * @returns {any} - Cached value or null
   */
  async get(key) {
    if (!this.isConnected) {
      logger.warn('Cache not connected, skipping get operation');
      return null;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const cached = await this.redis.get(fullKey);

      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Delete cache value
   * @param {string} key - Cache key
   */
  async delete(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.keyPrefix + key;
      await this.redis.del(fullKey);
      logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern - Pattern to match (e.g., 'risk:*')
   */
  async deletePattern(pattern) {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const fullPattern = this.keyPrefix + pattern;
      const keys = await this.redis.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.redis.del(...keys);
      logger.info(`Cache pattern deleted: ${pattern} (${keys.length} keys)`);
      return keys.length;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Get or set cache value (with lazy loading)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Async function to fetch value if not cached
   * @param {number} ttl - Time to live in seconds
   */
  async getOrSet(key, fetchFn, ttl = null) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    try {
      const value = await fetchFn();
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
      return value;
    } catch (error) {
      logger.error('Cache getOrSet fetch error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Generate cache key for risk assessment
   */
  riskKey(woredaId, date, hazardType) {
    return `risk:${woredaId}:${date}:${hazardType}`;
  }

  /**
   * Generate cache key for weather forecast
   */
  weatherKey(lat, lng, days) {
    return `weather:${lat}:${lng}:${days}`;
  }

  /**
   * Generate cache key for boundary data
   */
  boundaryKey(type, id) {
    return `boundary:${type}:${id}`;
  }

  /**
   * Increment counter with expiry
   */
  async increment(key, ttl = 3600) {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const count = await this.redis.incr(fullKey);

      if (count === 1) {
        // First increment, set expiry
        await this.redis.expire(fullKey, ttl);
      }

      return count;
    } catch (error) {
      logger.error('Cache increment error', { key, error: error.message });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info('stats');
      const keyspace = await this.redis.info('keyspace');
      const memory = await this.redis.info('memory');

      return {
        connected: true,
        keyspace,
        memory,
        stats: info,
      };
    } catch (error) {
      logger.error('Cache stats error', { error: error.message });
      return { connected: false, error: error.message };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('Redis cache disconnected');
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
