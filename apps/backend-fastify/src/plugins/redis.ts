import fp from 'fastify-plugin';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async function (fastify) {
  const redis = new Redis({
    host: fastify.config.REDIS_HOST,
    port: fastify.config.REDIS_PORT,
    password: fastify.config.REDIS_PASSWORD || undefined,
    lazyConnect: true,
  });

  // Test connection
  try {
    await redis.ping();
    fastify.log.info('Redis connection established');
  } catch (error) {
    fastify.log.error('Failed to connect to Redis:', error);
    throw error;
  }

  // Error handling
  redis.on('error', (err: Error) => {
    fastify.log.error({ err }, 'Redis error');
  });

  redis.on('connect', () => {
    fastify.log.info('Redis connected');
  });

  redis.on('disconnect', () => {
    fastify.log.warn('Redis disconnected');
  });

  // Make redis available throughout the app
  fastify.decorate('redis', redis);

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
});