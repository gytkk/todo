import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts);

  // Register core plugins
  await app.register(import('./plugins/env.js'));
  await app.register(import('./plugins/security.js'));
  await app.register(import('./plugins/database.js')); // PostgreSQL connection
  await app.register(import('./plugins/auth.js'));
  await app.register(import('./plugins/swagger.js'));

  // Register routes
  await app.register(import('./routes/health.js'), { prefix: '/' });
  await app.register(import('./routes/auth.js'), { prefix: '/auth' });
  await app.register(import('./routes/users.js'), { prefix: '/users' });
  await app.register(import('./routes/todos.js'), { prefix: '/todos' });
  await app.register(import('./routes/user-settings.js'), { prefix: '/user-settings' });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    const { statusCode = 500, message } = error;
    app.log.info(request);
    app.log.error(error);

    reply.status(statusCode).send({
      statusCode,
      message: statusCode === 500 ? 'Internal Server Error' : message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    });
  });

  // Not found handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return app;
}
