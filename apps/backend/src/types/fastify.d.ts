import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      NODE_ENV: string;
      LOG_LEVEL: string;
      PORT: number;
      HOST: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_REFRESH_EXPIRES_IN: string;
      FRONTEND_URL: string;
      ENABLE_SWAGGER: string;
    };
  }
  
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
  }
}