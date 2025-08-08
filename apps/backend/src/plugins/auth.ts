import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      iat?: number;
      exp?: number;
    };
    user: {
      id: string;
      email: string;
      name: string;
      profileImage?: string;
    };
  }
}

export default fp(async function (fastify) {
  await fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET,
    sign: {
      expiresIn: fastify.config.JWT_EXPIRES_IN,
    },
  });

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // JWT 토큰 검증
      await request.jwtVerify();
      
      // 사용자 유효성 추가 확인
      const authService = new AuthService(fastify);
      const user = await authService.validateUser((request as any).user.sub);
      
      if (!user) {
        return reply.code(401).send({ 
          message: 'User not found or inactive',
          statusCode: 401 
        });
      }

      // request.user에 전체 사용자 정보 추가
      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      };
      
    } catch (err) {
      fastify.log.error({ err }, 'Authentication failed');
      return reply.code(401).send({ 
        message: 'Unauthorized',
        statusCode: 401 
      });
    }
  });
});