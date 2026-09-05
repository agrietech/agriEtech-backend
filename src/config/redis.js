const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let isRedisAvailable = false;

// Detect if TLS is required (Upstash, Redis Cloud, etc.)
const useTls =
  process.env.REDIS_TLS === 'true' ||
  (env.REDIS_HOST && env.REDIS_HOST.includes('upstash.io')) ||
  (env.REDIS_HOST && env.REDIS_HOST.includes('redis-cloud'));

const redisUrl = env.REDIS_URL || process.env.REDIS_URL;

// Detect if Redis is explicitly configured
const redisConfigured =
  Boolean(redisUrl) ||
  (env.REDIS_HOST && env.REDIS_HOST !== 'localhost' && env.REDIS_HOST !== '127.0.0.1') ||
  Boolean(env.REDIS_PASSWORD);

let redis;

if (redisConfigured) {
  const redisOptions = {
    family: 4,
    tls: useTls ? { rejectUnauthorized: false } : undefined,
    keepAlive: 10000,
    connectTimeout: 10000,
    retryStrategy: (times) => {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
    maxRetriesPerRequest: null,
    enableOfflineQueue: false, // Don't queue indefinitely if Redis fails
  };

  if (redisUrl) {
    redis = new Redis(redisUrl, redisOptions);
  } else {
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      ...redisOptions,
    });
  }

  redis.on('error', (err) => {
    isRedisAvailable = false;
    // Log once as warning rather than crashing process
    logger.warn(`[Redis] Connection notice: ${err.message}`);
  });

  redis.on('connect', () => {
    isRedisAvailable = true;
    logger.info(`Redis connected successfully (${redisUrl ? 'REDIS_URL' : env.REDIS_HOST})`);
  });

  redis.on('ready', () => {
    isRedisAvailable = true;
  });

  redis.on('close', () => {
    isRedisAvailable = false;
  });
} else {
  // Create a dummy Redis instance that won't attempt connections
  redis = new Redis({
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
    maxRetriesPerRequest: null,
  });
  redis.on('error', () => {});
}

function isConnected() {
  return isRedisAvailable && redis.status === 'ready';
}

async function disconnectRedis() {
  try {
    if (redis && redis.status !== 'end') {
      await redis.quit();
    }
  } catch (_e) {
    // Ignore error during shutdown
  }
  isRedisAvailable = false;
}

module.exports = redis;
module.exports.isConnected = isConnected;
module.exports.disconnectRedis = disconnectRedis;
