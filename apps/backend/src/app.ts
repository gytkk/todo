import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts);

  // Register core plugins
  await app.register(import('./plugins/env'));
  await app.register(import('./plugins/security'));
  await app.register(import('./plugins/database')); // PostgreSQL connection
  await app.register(import('./plugins/auth'));
  await app.register(import('./plugins/swagger'));

  // Register routes
  await app.register(import('./routes/health'), { prefix: '/' });
  await app.register(import('./routes/auth'), { prefix: '/auth' });
  await app.register(import('./routes/users'), { prefix: '/users' });

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
