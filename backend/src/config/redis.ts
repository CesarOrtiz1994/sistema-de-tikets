import Redis from 'ioredis';
import { env } from './env';
import logger from './logger';

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redis) return redis;

  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis: max retries reached, giving up');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redis.on('error', (err) => {
      logger.warn('Redis connection error:', err.message);
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redis.connect().catch((err) => {
      logger.warn('Redis initial connect failed:', err.message);
      redis = null;
    });

    return redis;
  } catch (err: any) {
    logger.warn('Redis initialization failed:', err.message);
    redis = null;
    return null;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis disconnected');
  }
}
