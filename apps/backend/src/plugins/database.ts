import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { DatabaseService } from '../services/database.service';

const databasePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Connect to PostgreSQL
  const prisma = await DatabaseService.connect();
  
  // Register Prisma client instance with Fastify
  fastify.decorate('prisma', prisma);

  // Add graceful shutdown hook
  fastify.addHook('onClose', async (instance) => {
    await DatabaseService.disconnect();
    instance.log.info('PostgreSQL connection closed');
  });

  // Health check endpoint
  fastify.get('/health/database', async (request, reply) => {
    const isHealthy = await DatabaseService.healthCheck();
    
    if (isHealthy) {
      return { status: 'ok', database: 'postgresql', connected: true };
    } else {
      reply.code(503);
      return { status: 'error', database: 'postgresql', connected: false };
    }
  });
};

export default fp(databasePlugin, {
  name: 'database',
});