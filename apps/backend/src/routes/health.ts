import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      tags: ['health'],
      summary: 'Basic health check',
      description: 'Basic health check endpoint for the root path',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok'] },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'ok',
      message: 'Calendar Todo API is running',
    };
  });
}
