const Redis = require('ioredis');
const logger = require('./logger');
const env = require('../config/env');

/**
 * Cache Manager with Redis and In-Memory Fallback
 * Provides seamless caching utilities with TTL, compression, and automated fallback
 */
class CacheManager {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.memoryStore = new Map();
    this.keyPrefix = env.REDIS_KEY_PREFIX || 'agrietech:';
    this.defaultTTL = 3600; // 1 hour in seconds

    // Periodic memory cleanup (every 60s)
    setInterval(() => {
      const now = Date.now();
      for (const [k, item] of this.memoryStore.entries()) {
        if (now > item.expiresAt) {
          this.memoryStore.delete(k);
        }
      }
    }, 60000).unref();
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.redis = new Redis({
        host: env.REDIS_HOST || 'localhost',
        port: parseInt(env.REDIS_PORT, 10) || 6379,
        password: env.REDIS_PASSWORD || undefined,
        db: parseInt(env.REDIS_DB, 10) || 0,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 50, 1000);
        },
        maxRetriesPerRequest: parseInt(env.REDIS_MAX_RETRIES, 10) || 3,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis cache connected successfully');
      });

      this.redis.on('error', (_err) => {
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        this.isConnected = false;
      });

      await this.redis.connect();
      return true;
    } catch (_error) {
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Set cache value
   */
  async set(key, value, ttl = null) {
    const expiryTime = ttl || this.defaultTTL;

    if (!this.isConnected) {
      this.memoryStore.set(this.keyPrefix + key, {
        value,
        expiresAt: Date.now() + expiryTime * 1000,
      });
      return true;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const serialized = JSON.stringify(value);
      await this.redis.setex(fullKey, expiryTime, serialized);
      return true;
    } catch (error) {
      this.memoryStore.set(this.keyPrefix + key, {
        value,
        expiresAt: Date.now() + expiryTime * 1000,
      });
      return true;
    }
  }

  /**
   * Get cache value
   */
  async get(key) {
    const fullKey = this.keyPrefix + key;

    if (!this.isConnected) {
      const item = this.memoryStore.get(fullKey);
      if (!item) return null;
      if (Date.now() > item.expiresAt) {
        this.memoryStore.delete(fullKey);
        return null;
      }
      return item.value;
    }

    try {
      const cached = await this.redis.get(fullKey);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (_error) {
      const item = this.memoryStore.get(fullKey);
      if (!item) return null;
      if (Date.now() > item.expiresAt) {
        this.memoryStore.delete(fullKey);
        return null;
      }
      return item.value;
    }
  }

  /**
   * Delete cache value
   */
  async delete(key) {
    const fullKey = this.keyPrefix + key;
    this.memoryStore.delete(fullKey);

    if (this.isConnected) {
      try {
        await this.redis.del(fullKey);
      } catch (_e) {
        // Silently handle redis del failure in fallback
      }
    }
    return true;
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern) {
    let count = 0;
    const regex = new RegExp(`^${(this.keyPrefix + pattern).replace('*', '.*')}`);
    for (const k of this.memoryStore.keys()) {
      if (regex.test(k)) {
        this.memoryStore.delete(k);
        count++;
      }
    }

    if (this.isConnected) {
      try {
        const fullPattern = this.keyPrefix + pattern;
        const keys = await this.redis.keys(fullPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          count += keys.length;
        }
      } catch (_e) {
        // Silently handle redis pattern del failure in fallback
      }
    }

    return count;
  }

  /**
   * Get or set cache value (with lazy loading)
   */
  async getOrSet(key, fetchFn, ttl = null) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

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
   * Increment counter with expiry
   */
  async increment(key, ttl = 3600) {
    const fullKey = this.keyPrefix + key;

    if (!this.isConnected) {
      const item = this.memoryStore.get(fullKey);
      let count = 1;
      if (item && Date.now() <= item.expiresAt) {
        count = (typeof item.value === 'number' ? item.value : 0) + 1;
      }
      this.memoryStore.set(fullKey, {
        value: count,
        expiresAt: Date.now() + ttl * 1000,
      });
      return count;
    }

    try {
      const count = await this.redis.incr(fullKey);
      if (count === 1) {
        await this.redis.expire(fullKey, ttl);
      }
      return count;
    } catch (_error) {
      return 1;
    }
  }

  riskKey(woredaId, date, hazardType) {
    return `risk:${woredaId}:${date}:${hazardType}`;
  }

  weatherKey(lat, lng, days) {
    return `weather:${lat}:${lng}:${days}`;
  }

  boundaryKey(type, id) {
    return `boundary:${type}:${id}`;
  }

  async getStats() {
    return {
      connected: this.isConnected,
      memoryKeysCount: this.memoryStore.size,
      mode: this.isConnected ? 'REDIS' : 'IN_MEMORY_FALLBACK',
    };
  }

  async disconnect() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (_e) {
        // Silently handle quit error during shutdown
      }
      this.isConnected = false;
    }
  }
}

const cacheManager = new CacheManager();

module.exports = cacheManager;
