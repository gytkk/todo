import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';

const schema = {
  type: 'object',
  required: ['JWT_SECRET'],
  properties: {
    NODE_ENV: {
      type: 'string',
      default: 'development',
    },
    PORT: {
      type: 'number',
      default: 3002,
    },
    HOST: {
      type: 'string',
      default: '0.0.0.0',
    },
    JWT_SECRET: {
      type: 'string',
    },
    JWT_EXPIRES_IN: {
      type: 'string',
      default: '7d',
    },
    JWT_REFRESH_EXPIRES_IN: {
      type: 'string',
      default: '30d',
    },
    FRONTEND_URL: {
      type: 'string',
      default: 'http://localhost:3000',
    },
    ENABLE_SWAGGER: {
      type: 'string',
      default: 'true',
    },
  },
};

export default fp(async function (fastify) {
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true,
  });
});