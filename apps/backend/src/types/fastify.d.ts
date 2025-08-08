import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      NODE_ENV: string;
      PORT: number;
      HOST: string;
      REDIS_HOST: string;
      REDIS_PORT: number;
      REDIS_PASSWORD?: string;
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