import { FastifyInstance } from 'fastify';
import { Theme } from '@prisma/client';
import { UserSettingsPostgresRepository } from '../repositories/postgres/user-settings.repository.js';
import { CategoryPostgresRepository, CreateCategoryDto } from '../repositories/postgres/category.repository.js';
import { TodoPostgresRepository } from '../repositories/postgres/todo.repository.js';

interface UserSettingsUpdateBody {
  theme?: Theme;
  language?: string;
  themeColor?: string;
  customColor?: string;
  defaultView?: string;
  dateFormat?: string;
  timeFormat?: string;
  timezone?: string;
  weekStart?: string;
  oldTodoDisplayLimit?: number;
  autoMoveTodos?: boolean;
  showTaskMoveNotifications?: boolean;
  saturationEnabled?: boolean;
  saturationLevels?: Array<{ days: number; opacity: number }>;
  completedTodoDisplay?: string;
  showWeekends?: boolean;
  autoBackup?: boolean;
  backupInterval?: string;
}

interface CategoryCreateBody {
  name: string;
  color: string;
  icon?: string;
  isDefault?: boolean;
}

interface CategoryUpdateBody {
  name?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

interface CategoryFilterBody {
  enabled: boolean;
}

interface CategoryReorderBody {
  categoryIds: string[];
}

interface CategoryParams {
  id: string;
}

const userSettingsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        theme: { type: 'string', enum: ['LIGHT', 'DARK', 'SYSTEM'] },
        language: { type: 'string' },
        themeColor: { type: 'string' },
        customColor: { type: 'string' },
        defaultView: { type: 'string' },
        dateFormat: { type: 'string' },
        timeFormat: { type: 'string' },
        timezone: { type: 'string' },
        weekStart: { type: 'string' },
        oldTodoDisplayLimit: { type: 'number' },
        autoMoveTodos: { type: 'boolean' },
        showTaskMoveNotifications: { type: 'boolean' },
        saturationEnabled: { type: 'boolean' },
        saturationLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              days: { type: 'number' },
              opacity: { type: 'number' },
            },
          },
        },
        completedTodoDisplay: { type: 'string' },
        showWeekends: { type: 'boolean' },
        autoBackup: { type: 'boolean' },
        backupInterval: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  },
};

const categorySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    color: { type: 'string' },
    icon: { type: ['string', 'null'] },
    isDefault: { type: 'boolean' },
    order: { type: 'number' },
    userId: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export default async function (fastify: FastifyInstance) {
  const userSettingsRepository = new UserSettingsPostgresRepository(fastify);
  const categoryRepository = new CategoryPostgresRepository(fastify);
  const todoRepository = new TodoPostgresRepository(fastify);

  // GET /user-settings - 사용자 설정 조회
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    schema: {
      ...userSettingsSchema,
      tags: ['user-settings'],
      summary: '사용자 설정 조회',
      description: '현재 사용자의 설정을 조회합니다',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const user = request.user;
    
    let settings = await userSettingsRepository.findByUserId(user.id);
    
    // 설정이 없으면 생성
    if (!settings) {
      settings = await userSettingsRepository.create({ userId: user.id });
    }
    
    reply.send(settings);
  });

  // PUT /user-settings - 사용자 설정 수정
  fastify.put<{ Body: UserSettingsUpdateBody }>('/', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['user-settings'],
      summary: '사용자 설정 수정',
      description: '사용자 설정을 수정합니다',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['LIGHT', 'DARK', 'SYSTEM'] },
          language: { type: 'string' },
          themeColor: { type: 'string' },
          customColor: { type: 'string' },
          defaultView: { type: 'string' },
          dateFormat: { type: 'string' },
          timeFormat: { type: 'string' },
          timezone: { type: 'string' },
          weekStart: { type: 'string' },
          oldTodoDisplayLimit: { type: 'number' },
          autoMoveTodos: { type: 'boolean' },
          showTaskMoveNotifications: { type: 'boolean' },
          saturationEnabled: { type: 'boolean' },
          saturationLevels: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                days: { type: 'number' },
                opacity: { type: 'number' },
              },
            },
          },
          completedTodoDisplay: { type: 'string' },
          showWeekends: { type: 'boolean' },
          autoBackup: { type: 'boolean' },
          backupInterval: { type: 'string' },
        },
      },
      response: userSettingsSchema.response,
    },
  }, async (request, reply) => {
    const user = request.user;
    const updates = request.body;
    
    const settings = await userSettingsRepository.updateByUserId(user.id, updates);
    
    if (settings) {
      reply.send(settings);
    } else {
      reply.code(500).send({
        statusCode: 500,
        message: '설정 수정 중 오류가 발생했습니다',
      });
    }
  });

  // GET /user-settings/categories - 카테고리 목록 조회
  fastify.get('/categories', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['user-settings'],
      summary: '카테고리 목록 조회',
      description: '사용자의 카테고리 목록을 조회합니다',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: categorySchema,
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    
    const categories = await categoryRepository.findByUserId(user.id);
    reply.send(categories);
  });

  // POST /user-settings/categories - 카테고리 생성
  fastify.post<{ Body: CategoryCreateBody }>('/categories', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['user-settings'],
      summary: '카테고리 생성',
      description: '새로운 카테고리를 생성합니다 (최대 10개)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'color'],
        properties: {
          name: { type: 'string', minLength: 1 },
          color: { type: 'string' },
          icon: { type: 'string' },
          isDefault: { type: 'boolean' },
        },
      },
      response: {
        201: categorySchema,
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const { name, color, icon, isDefault } = request.body;
    
    // 카테고리 개수 확인 (최대 10개)
    const existingCategories = await categoryRepository.findByUserId(user.id);
    if (existingCategories.length >= 10) {
      return reply.code(400).send({
        statusCode: 400,
        message: '카테고리는 최대 10개까지 생성할 수 있습니다',
      });
    }
    
    // 기본 카테고리 설정 처리
    if (isDefault) {
      // 기존 기본 카테고리 해제
      for (const cat of existingCategories) {
        if (cat.isDefault) {
          await categoryRepository.update(cat.id, { isDefault: false });
        }
      }
    }
    
    const categoryData: CreateCategoryDto = {
      name,
      color,
      icon,
      isDefault: isDefault || false,
      order: existingCategories.length,
      userId: user.id,
    };
    
    const category = await categoryRepository.create(categoryData);
    reply.code(201).send(category);
  });

  // GET /user-settings/categories/available-colors - 사용 가능한 색상 조회
  fastify.get('/categories/available-colors', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['user-settings'],
      summary: '사용 가능한 색상 조회',
      description: '카테고리에 사용 가능한 색상 목록을 조회합니다',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    
    // 사용된 색상 조회
    const categories = await categoryRepository.findByUserId(user.id);
    const usedColors = categories.map(cat => cat.color);
    
    // 사용 가능한 색상 목록 (예시)
    const allColors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e', '#dc2626', '#ea580c', '#d97706',
    ];
    
    const availableColors = allColors.filter(color => !usedColors.includes(color));
    reply.send(availableColors);
  });

  // PUT /user-settings/categories/:id - 카테고리 수정
  fastify.put<{ Params: CategoryParams; Body: CategoryUpdateBody }>('/categories/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['user-settings'],
      summary: '카테고리 수정',
      description: '카테고리 정보를 수정합니다',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          color: { type: 'string' },
          icon: { type: 'string' },
          isDefault: { type: 'boolean' },
        },
      },
      response: {
        200: categorySchema,
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params;
    const updates = request.body;
    
    // 카테고리 존재 및 소유권 확인
    const category = await categoryRepository.findById(id);
    if (!category) {
      return reply.code(404).send({
        statusCode: 404,
        message: '카테고리를 찾을 수 없습니다',
      });
    }
    
    if (category.userId !== user.id) {
      return reply.code(403).send({
        statusCode: 403,
        message: '이 카테고리를 수정할 권한이 없습니다',
      });
    }
    
    // 기본 카테고리 설정 처리
    if (updates.isDefault === true && !category.isDefault) {
      // 기존 기본 카테고리 해제
      const categories = await categoryRepository.findByUserId(user.id);
      for (const cat of categories) {
        if (cat.isDefault && cat.id !== id) {
          await categoryRepository.update(cat.id, { isDefault: false });
        }
      }
    }
    
    const updatedCategory = await categoryRepository.update(id, updates);
    
    if (updatedCategory) {
      reply.send(updatedCategory);
    } else {
      reply.code(500).send({
        statusCode: 500,
        message: '카테고리 수정 중 오류가 발생했습니다',
      });
    }
  });

  // DELETE /user-settings/categories/:id - 카테고리 삭제
  fastify.delete<{ Params: CategoryParams }>('/categories/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['user-settings'],
      summary: '카테고리 삭제',
      description: '카테고리를 삭제합니다',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params;
    
    // 카테고리 존재 및 소유권 확인
    const category = await categoryRepository.findById(id);
    if (!category) {
      return reply.code(404).send({
        statusCode: 404,
        message: '카테고리를 찾을 수 없습니다',
      });
    }
    
    if (category.userId !== user.id) {
      return reply.code(403).send({
        statusCode: 403,
        message: '이 카테고리를 삭제할 권한이 없습니다',
      });
    }
    
    // 해당 카테고리의 TODO가 있는지 확인
    const todos = await todoRepository.findByFilter({
      userId: user.id,
      categoryId: id,
    });
    
    if (todos.length > 0) {
      return reply.code(400).send({
        statusCode: 400,
        message: '이 카테고리에 TODO가 있어 삭제할 수 없습니다. 먼저 TODO를 삭제하거나 다른 카테고리로 이동해주세요.',
      });
    }
    
    const success = await categoryRepository.delete(id);
    
    if (success) {
      // 카테고리 순서 재정렬
      const remainingCategories = await categoryRepository.findByUserId(user.id);
      for (let i = 0; i < remainingCategories.length; i++) {
        if (remainingCategories[i].order !== i) {
          await categoryRepository.update(remainingCategories[i].id, { order: i });
        }
      }
      
      reply.send({ message: '카테고리가 성공적으로 삭제되었습니다' });
    } else {
      reply.code(500).send({
        statusCode: 500,
        message: '카테고리 삭제 중 오류가 발생했습니다',
      });
    }
  });

  // PUT /user-settings/categories/:id/filter - 카테고리 필터 설정
  fastify.put<{ Params: CategoryParams; Body: CategoryFilterBody }>('/categories/:id/filter', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['user-settings'],
      summary: '카테고리 필터 설정',
      description: '카테고리 필터 활성화/비활성화를 설정합니다',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['enabled'],
        properties: {
          enabled: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            categoryId: { type: 'string' },
            filterEnabled: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params;
    const { enabled } = request.body;
    
    // 카테고리 존재 및 소유권 확인
    const category = await categoryRepository.findById(id);
    if (!category) {
      return reply.code(404).send({
        statusCode: 404,
        message: '카테고리를 찾을 수 없습니다',
      });
    }
    
    if (category.userId !== user.id) {
      return reply.code(403).send({
        statusCode: 403,
        message: '이 카테고리를 수정할 권한이 없습니다',
      });
    }
    
    // 필터 설정은 클라이언트 측에서 관리하거나 별도 테이블이 필요
    // 여기서는 간단한 응답만 반환
    reply.send({
      message: `카테고리 필터가 ${enabled ? '활성화' : '비활성화'}되었습니다`,
      categoryId: id,
      filterEnabled: enabled,
    });
  });

  // PUT /user-settings/categories/reorder - 카테고리 순서 변경
  fastify.put<{ Body: CategoryReorderBody }>('/categories/reorder', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['user-settings'],
      summary: '카테고리 순서 변경',
      description: '카테고리들의 표시 순서를 변경합니다',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['categoryIds'],
        properties: {
          categoryIds: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            updatedCount: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const { categoryIds } = request.body;
    
    // 모든 카테고리가 사용자 소유인지 확인
    const userCategories = await categoryRepository.findByUserId(user.id);
    const userCategoryIds = userCategories.map(cat => cat.id);
    
    for (const categoryId of categoryIds) {
      if (!userCategoryIds.includes(categoryId)) {
        return reply.code(400).send({
          statusCode: 400,
          message: '유효하지 않은 카테고리 ID가 포함되어 있습니다',
        });
      }
    }
    
    // 순서 업데이트
    let updatedCount = 0;
    for (let i = 0; i < categoryIds.length; i++) {
      const updated = await categoryRepository.update(categoryIds[i], { order: i });
      if (updated) updatedCount++;
    }
    
    reply.send({
      message: '카테고리 순서가 성공적으로 변경되었습니다',
      updatedCount,
    });
  });
}