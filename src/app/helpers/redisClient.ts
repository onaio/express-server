import Redis from 'ioredis';
import { EXPRESS_REDIS_STAND_ALONE_URL, EXPRESS_REDIS_SENTINEL_CONFIG } from '../../configs/envs';
import { winstonLogger } from '../../configs/winston';

export const redisIsConfigured = !!(
  Object.entries(EXPRESS_REDIS_SENTINEL_CONFIG ?? {}).length > 0 || EXPRESS_REDIS_STAND_ALONE_URL
);

export const getRedisClient = () => {
  // use redis session store if redis is available else default to file store
  // check for and use a single redis node
  if (EXPRESS_REDIS_STAND_ALONE_URL !== undefined) {
    // TODO allow options only for dev server
    const redisClient = new Redis(EXPRESS_REDIS_STAND_ALONE_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisClient.on('connect', () => winstonLogger.info('Redis single node client connected!'));
    redisClient.on('reconnecting', () => winstonLogger.info('Redis single node client trying to reconnect'));
    redisClient.on('error', (err) => winstonLogger.error('Redis single node client error:', err));
    redisClient.on('end', () => winstonLogger.error('Redis single node client error: Redis client disconnected'));

    return redisClient;
  }
  // check for and use redis sentinel if available
  if (EXPRESS_REDIS_SENTINEL_CONFIG !== undefined && Object.keys(EXPRESS_REDIS_SENTINEL_CONFIG).length > 0) {
    const redisClient = new Redis({
      ...EXPRESS_REDIS_SENTINEL_CONFIG,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisClient.on('connect', () => winstonLogger.info('Redis sentinel client connected!'));
    redisClient.on('reconnecting', () => winstonLogger.info('Redis sentinel client trying to reconnect'));
    redisClient.on('error', (err) => winstonLogger.error('Redis sentinel client error:', err));
    redisClient.on('end', () => winstonLogger.error('Redis sentinel client error: Redis client disconnected'));

    return redisClient;
  }
};
