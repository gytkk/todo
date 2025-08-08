import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/health', {
    schema: {
      tags: ['health'],
      summary: 'Health check',
      description: 'Check if the API is running',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            database: { type: 'string', enum: ['connected', 'disconnected'] },
          },
        },
      },
    },
  }, async (request, reply) => {
    // Check PostgreSQL connection
    const databaseStatus = await fastify.prisma.$queryRaw`SELECT 1`
      .then(() => 'connected')
      .catch(() => 'disconnected');
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: databaseStatus,
    };
  });
}