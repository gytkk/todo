import { FastifyInstance } from 'fastify';
import { AuthService, RegisterDto, LoginDto } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';

export default async function (fastify: FastifyInstance) {
  const authService = new AuthService(fastify);

  // 회원가입
  fastify.post('/register', {
    schema: {
      ...registerSchema,
      tags: ['auth'],
      summary: '회원가입',
      description: '새 사용자 계정을 생성합니다',
    },
  }, async (request, reply) => {
    const dto = request.body as RegisterDto;

    try {
      const user = await authService.register(dto);
      
      reply.code(201).send({
        message: '회원가입이 완료되었습니다',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다';
      reply.code(400).send({
        statusCode: 400,
        message,
      });
    }
  });

  // 로그인
  fastify.post('/login', {
    schema: {
      ...loginSchema,
      tags: ['auth'],
      summary: '로그인',
      description: '사용자 인증 후 JWT 토큰을 발급합니다',
    },
  }, async (request, reply) => {
    const dto = request.body as LoginDto;

    try {
      const result = await authService.login(dto);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다';
      reply.code(401).send({
        statusCode: 401,
        message,
      });
    }
  });

  // 토큰 갱신
  fastify.post('/refresh', {
    schema: {
      ...refreshTokenSchema,
      tags: ['auth'],
      summary: '토큰 갱신',
      description: 'Refresh 토큰으로 새 Access 토큰을 발급합니다',
    },
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    try {
      const result = await authService.refreshToken(refreshToken);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '토큰 갱신 중 오류가 발생했습니다';
      reply.code(401).send({
        statusCode: 401,
        message,
      });
    }
  });

  // 로그아웃 (클라이언트에서 토큰을 삭제하면 됨)
  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: '로그아웃',
      description: '사용자 로그아웃 (클라이언트에서 토큰 삭제)',
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async () => {
    return { message: '로그아웃되었습니다' };
  });
}