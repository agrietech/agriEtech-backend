const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let isRedisAvailable = false;

// Detect if TLS is required (Upstash, Redis Cloud, etc.)
const useTls =
  process.env.REDIS_TLS === 'true' ||
  (env.REDIS_HOST && env.REDIS_HOST.includes('upstash.io')) ||
  (env.REDIS_HOST && env.REDIS_HOST.includes('redis-cloud'));

// Detect if Redis is explicitly configured
const redisConfigured =
  (env.REDIS_HOST && env.REDIS_HOST !== 'localhost' && env.REDIS_HOST !== '127.0.0.1') ||
  env.REDIS_PASSWORD;

let redis;

if (redisConfigured) {
  redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    tls: useTls ? {} : undefined,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 100, 1000);
    },
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
  });

  redis.on('error', (_err) => {
    isRedisAvailable = false;
  });

  redis.on('connect', () => {
    isRedisAvailable = true;
    logger.info(`Redis connected successfully (${env.REDIS_HOST})`);
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

module.exports = redis;
module.exports.isConnected = isConnected;
