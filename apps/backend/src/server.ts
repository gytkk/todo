import { buildApp } from './app';

const start = async () => {
  try {
    const app = await buildApp({
      logger: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      },
    });

    const port = Number(process.env.PORT) || 3002;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });

    const address = app.server.address();
    const portUsed = typeof address === 'object' ? address?.port : port;
    
    console.log(`🚀 Server is running on http://localhost:${portUsed}`);
    if (process.env.ENABLE_SWAGGER === 'true') {
      console.log(`📚 API documentation available at http://localhost:${portUsed}/documentation`);
    }
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();