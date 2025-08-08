import { FastifyInstance } from 'fastify';
import { UserService, UpdateUserDto, ChangePasswordDto } from '../services/user.service';
import { updateUserProfileSchema, changePasswordSchema, getUserProfileSchema } from '../schemas/user.schema';

export default async function (fastify: FastifyInstance) {
  const userService = new UserService(fastify);

  // 사용자 프로필 조회
  fastify.get('/profile', {
    schema: {
      ...getUserProfileSchema,
      tags: ['users'],
      summary: '사용자 프로필 조회',
      description: '현재 사용자의 프로필 정보를 조회합니다',
      security: [{ Bearer: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const user = await userService.findById(request.user.id);
    
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  });

  // 사용자 프로필 수정
  fastify.put('/profile', {
    schema: {
      ...updateUserProfileSchema,
      tags: ['users'],
      summary: '사용자 프로필 수정',
      description: '현재 사용자의 프로필 정보를 수정합니다',
      security: [{ Bearer: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const dto = request.body as UpdateUserDto;

    try {
      const updatedUser = await userService.updateProfile(request.user.id, dto);
      
      if (!updatedUser) {
        reply.code(404).send({
          statusCode: 404,
          message: '사용자를 찾을 수 없습니다',
        });
        return;
      }

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로필 수정 중 오류가 발생했습니다';
      reply.code(400).send({
        statusCode: 400,
        message,
      });
    }
  });

  // 비밀번호 변경
  fastify.put('/change-password', {
    schema: {
      ...changePasswordSchema,
      tags: ['users'],
      summary: '비밀번호 변경',
      description: '현재 사용자의 비밀번호를 변경합니다',
      security: [{ Bearer: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const dto = request.body as ChangePasswordDto;

    try {
      await userService.changePassword(request.user.id, dto);
      
      return {
        message: '비밀번호가 성공적으로 변경되었습니다',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다';
      reply.code(400).send({
        statusCode: 400,
        message,
      });
    }
  });
}