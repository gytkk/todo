import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export default fp(async function (fastify) {
  if (fastify.config.ENABLE_SWAGGER !== 'true') {
    return;
  }

  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Todo Calendar API',
        description: 'Calendar-based todo application API built with Fastify',
        version: '1.0.0',
      },
      externalDocs: {
        url: 'https://github.com/yourusername/todo-app',
        description: 'Find more info here',
      },
      // host를 제거하여 현재 접근한 호스트를 자동으로 사용하도록 함
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management endpoints' },
        { name: 'todos', description: 'Todo management endpoints' },
        { name: 'user-settings', description: 'User settings and categories' },
      ],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"',
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
  });
});
