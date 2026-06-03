const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

async function connectRedis() {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      connectTimeout: 10000,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err.message);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('⚠️  Redis connection failed — running without cache:', error.message);
    redisClient = null;
  }
}

function getRedis() {
  return redisClient;
}

/**
 * Get cached value
 */
async function getCache(key) {
  if (!redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Set cached value with TTL in seconds
 */
async function setCache(key, value, ttlSeconds = 3600) {
  if (!redisClient) return;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (e) {
    // Cache write failure is non-critical
  }
}

/**
 * Delete cached value
 */
async function deleteCache(key) {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (e) {}
}

/**
 * Increment a counter (for rate limiting fallback)
 */
async function incrementCounter(key, ttlSeconds = 3600) {
  if (!redisClient) return 0;
  try {
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, ttlSeconds);
    return count;
  } catch (e) {
    return 0;
  }
}

module.exports = {
  connectRedis,
  getRedis,
  getCache,
  setCache,
  deleteCache,
  incrementCounter
};
