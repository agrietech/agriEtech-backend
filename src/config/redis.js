const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let isRedisAvailable = false;

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 100, 1000);
  },
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
};

const redis = new Redis(redisConfig);

// Silence and handle connection errors gracefully
redis.on('error', (_err) => {
  isRedisAvailable = false;
});

redis.on('connect', () => {
  isRedisAvailable = true;
  logger.info('Redis connected successfully');
});

redis.on('close', () => {
  isRedisAvailable = false;
});

if (env.NODE_ENV !== 'test') {
  redis.connect().catch((_err) => {
    isRedisAvailable = false;
  });
}

function isConnected() {
  return isRedisAvailable && redis.status === 'ready';
}

module.exports = redis;
module.exports.isConnected = isConnected;
