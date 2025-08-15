import { FastifyInstance } from 'fastify';
import { TodoType } from '@prisma/client';
import { TodoPostgresRepository, TodoFilterOptions } from '../repositories/postgres/todo.repository.js';
import { CategoryPostgresRepository } from '../repositories/postgres/category.repository.js';

interface TodoCreateBody {
  title: string;
  date: string;
  categoryId: string;
  todoType?: TodoType;
  completed?: boolean;
}

interface TodoUpdateBody {
  title?: string;
  date?: string;
  categoryId?: string;
  todoType?: TodoType;
  completed?: boolean;
}

interface TodoQueryParams {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  completed?: boolean;
  todoType?: TodoType;
}

interface TodoParams {
  id: string;
}

interface MoveTasksBody {
  taskIds: string[];
  newDate: string;
}

const todoCreateSchema = {
  body: {
    type: 'object',
    required: ['title', 'date', 'categoryId'],
    properties: {
      title: { type: 'string', minLength: 1 },
      date: { type: 'string', format: 'date-time' },
      categoryId: { type: 'string' },
      todoType: { type: 'string', enum: ['EVENT', 'TASK'] },
      completed: { type: 'boolean' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        date: { type: 'string' },
        categoryId: { type: 'string' },
        todoType: { type: 'string' },
        completed: { type: 'boolean' },
        userId: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  },
};

const todoUpdateSchema = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1 },
      date: { type: 'string', format: 'date-time' },
      categoryId: { type: 'string' },
      todoType: { type: 'string', enum: ['EVENT', 'TASK'] },
      completed: { type: 'boolean' },
    },
  },
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
        id: { type: 'string' },
        title: { type: 'string' },
        date: { type: 'string' },
        categoryId: { type: 'string' },
        todoType: { type: 'string' },
        completed: { type: 'boolean' },
        userId: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  },
};

const todoListSchema = {
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      categoryId: { type: 'string' },
      completed: { type: 'boolean' },
      todoType: { type: 'string', enum: ['EVENT', 'TASK'] },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        todos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              date: { type: 'string' },
              categoryId: { type: 'string' },
              todoType: { type: 'string' },
              completed: { type: 'boolean' },
              userId: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              category: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  color: { type: 'string' },
                  icon: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
        stats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            completed: { type: 'number' },
            incomplete: { type: 'number' },
            completionRate: { type: 'number' },
            recentCompletions: { type: 'number' },
            byType: {
              type: 'object',
              properties: {
                event: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    completed: { type: 'number' },
                    incomplete: { type: 'number' },
                  },
                },
                task: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    completed: { type: 'number' },
                    incomplete: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default async function (fastify: FastifyInstance) {
  const todoRepository = new TodoPostgresRepository(fastify);
  const categoryRepository = new CategoryPostgresRepository(fastify);

  // GET /todos - Todo 목록 조회
  fastify.get<{ Querystring: TodoQueryParams }>('/', {
    onRequest: [fastify.authenticate],
    schema: {
      ...todoListSchema,
      tags: ['todos'],
      summary: 'Todo 목록 조회',
      description: '사용자의 Todo 목록을 조회합니다',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const user = request.user;
    const { startDate, endDate, categoryId, completed, todoType } = request.query;

    const filter: TodoFilterOptions = {
      userId: user.id,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      categoryId,
      completed,
      todoType,
    };

    const todos = await todoRepository.findByFilter(filter);
    const stats = await todoRepository.getStatsByUserId(user.id);
    
    // 디버깅을 위한 로깅
    console.log('Backend response - todos type:', typeof todos);
    console.log('Backend response - todos value:', todos);
    console.log('Backend response - stats:', stats);
    
    reply.send({
      todos,
      stats
    });
  });

  // POST /todos - Todo 생성
  fastify.post<{ Body: TodoCreateBody }>('/', {
    onRequest: [fastify.authenticate],
    schema: {
      ...todoCreateSchema,
      tags: ['todos'],
      summary: 'Todo 생성',
      description: '새로운 Todo를 생성합니다',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const user = request.user;
    const { title, date, categoryId, todoType, completed } = request.body;

    // 카테고리 소유권 확인
    const category = await categoryRepository.findById(categoryId);
    if (!category || category.userId !== user.id) {
      return reply.code(404).send({
        statusCode: 404,
        message: '카테고리를 찾을 수 없습니다',
      });
    }

    const todo = await todoRepository.create({
      title,
      date: new Date(date),
      categoryId,
      todoType: todoType || TodoType.EVENT,
      completed: completed || false,
      userId: user.id,
    });

    reply.code(201).send(todo);
  });

  // GET /todos/stats - Todo 통계 조회 (specific routes must come before parameterized routes)
  fastify.get('/stats', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['todos'],
      summary: 'Todo 통계 조회',
      description: '사용자의 Todo 통계를 조회합니다',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            completed: { type: 'number' },
            incomplete: { type: 'number' },
            byType: {
              type: 'object',
              properties: {
                event: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    completed: { type: 'number' },
                    incomplete: { type: 'number' },
                  },
                },
                task: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    completed: { type: 'number' },
                    incomplete: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const stats = await todoRepository.getStatsByUserId(user.id);
    reply.send(stats);
  });

  // GET /todos/tasks-due - 이동 대상 태스크 조회
  fastify.get('/tasks-due', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['todos'],
      summary: '이동 대상 태스크 조회',
      description: '오늘 이전의 미완료 태스크를 조회합니다',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              date: { type: 'string' },
              categoryId: { type: 'string' },
              todoType: { type: 'string' },
              completed: { type: 'boolean' },
              userId: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tasks = await todoRepository.findIncompleteTasks(user.id, today);
    reply.send(tasks);
  });

  // POST /todos/move-tasks - 미완료 태스크 날짜 이동
  fastify.post<{ Body: MoveTasksBody }>('/move-tasks', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['todos'],
      summary: '미완료 태스크 날짜 이동',
      description: '선택한 태스크들을 새로운 날짜로 이동합니다',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['taskIds', 'newDate'],
        properties: {
          taskIds: {
            type: 'array',
            items: { type: 'string' },
          },
          newDate: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            movedCount: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const { taskIds, newDate } = request.body;

    const success = await todoRepository.moveTasks(user.id, taskIds, new Date(newDate));
    
    if (success) {
      reply.send({
        success: true,
        message: '태스크가 성공적으로 이동되었습니다',
        movedCount: taskIds.length,
      });
    } else {
      reply.code(500).send({
        success: false,
        message: '태스크 이동 중 오류가 발생했습니다',
        movedCount: 0,
      });
    }
  });

  // GET /todos/:id - 특정 Todo 조회
  fastify.get<{ Params: TodoParams }>('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['todos'],
      summary: '특정 Todo 조회',
      description: 'ID로 특정 Todo를 조회합니다',
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
            id: { type: 'string' },
            title: { type: 'string' },
            date: { type: 'string' },
            categoryId: { type: 'string' },
            todoType: { type: 'string' },
            completed: { type: 'boolean' },
            userId: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            category: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                color: { type: 'string' },
                icon: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params;

    const todo = await todoRepository.findByIdWithCategory(id);
    
    if (!todo) {
      return reply.code(404).send({
        statusCode: 404,
        message: 'Todo를 찾을 수 없습니다',
      });
    }

    // 소유권 확인
    if (todo.userId !== user.id) {
      return reply.code(403).send({
        statusCode: 403,
        message: '이 Todo에 접근할 권한이 없습니다',
      });
    }

    reply.send(todo);
  });

  // PUT /todos/:id - Todo 수정
  fastify.put<{ Params: TodoParams; Body: TodoUpdateBody }>('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      ...todoUpdateSchema,
      tags: ['todos'],
      summary: 'Todo 수정',
      description: 'Todo 정보를 수정합니다',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params;
    const updates = request.body;

    // Todo 존재 및 소유권 확인
    const existingTodo = await todoRepository.findById(id);
    if (!existingTodo) {
      return reply.code(404).send({
        statusCode: 404,
        message: 'Todo를 찾을 수 없습니다',
      });
    }

    if (existingTodo.userId !== user.id) {
      return reply.code(403).send({
        statusCode: 403,
        message: '이 Todo를 수정할 권한이 없습니다',
      });
    }

    // 카테고리 변경 시 소유권 확인
    if (updates.categoryId && updates.categoryId !== existingTodo.categoryId) {
      const category = await categoryRepository.findById(updates.categoryId);
      if (!category || category.userId !== user.id) {
        return reply.code(404).send({
          statusCode: 404,
          message: '카테고리를 찾을 수 없습니다',
        });
      }
    }

    const updatedData: Record<string, unknown> = {};
    if (updates.title !== undefined) updatedData.title = updates.title;
    if (updates.date !== undefined) updatedData.date = new Date(updates.date);
    if (updates.categoryId !== undefined) updatedData.categoryId = updates.categoryId;
    if (updates.todoType !== undefined) updatedData.todoType = updates.todoType;
    if (updates.completed !== undefined) updatedData.completed = updates.completed;

    const updatedTodo = await todoRepository.update(id, updatedData);
    reply.send(updatedTodo);
  });

  // DELETE /todos/:id - Todo 삭제
  fastify.delete<{ Params: TodoParams }>('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['todos'],
      summary: 'Todo 삭제',
      description: 'Todo를 삭제합니다',
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

    // Todo 존재 및 소유권 확인
    const todo = await todoRepository.findById(id);
    if (!todo) {
      return reply.code(404).send({
        statusCode: 404,
        message: 'Todo를 찾을 수 없습니다',
      });
    }

    if (todo.userId !== user.id) {
      return reply.code(403).send({
        statusCode: 403,
        message: '이 Todo를 삭제할 권한이 없습니다',
      });
    }

    const success = await todoRepository.delete(id);
    
    if (success) {
      reply.send({ message: 'Todo가 성공적으로 삭제되었습니다' });
    } else {
      reply.code(500).send({
        statusCode: 500,
        message: 'Todo 삭제 중 오류가 발생했습니다',
      });
    }
  });

  // DELETE /todos - 모든 Todo 삭제
  fastify.delete('/', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['todos'],
      summary: '모든 Todo 삭제',
      description: '사용자의 모든 Todo를 삭제합니다',
      security: [{ bearerAuth: [] }],
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
    
    const success = await todoRepository.deleteAllByUserId(user.id);
    
    if (success) {
      reply.send({ message: '모든 Todo가 성공적으로 삭제되었습니다' });
    } else {
      reply.code(500).send({
        statusCode: 500,
        message: 'Todo 삭제 중 오류가 발생했습니다',
      });
    }
  });

  // PATCH /todos/:id/toggle - Todo 완료 상태 토글
  fastify.patch<{ Params: TodoParams }>('/:id/toggle', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['todos'],
      summary: 'Todo 완료 상태 토글',
      description: 'Todo의 완료 상태를 토글합니다',
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
            id: { type: 'string' },
            title: { type: 'string' },
            date: { type: 'string' },
            categoryId: { type: 'string' },
            todoType: { type: 'string' },
            completed: { type: 'boolean' },
            userId: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params;

    // Todo 존재 및 소유권 확인
    const todo = await todoRepository.findById(id);
    if (!todo) {
      return reply.code(404).send({
        statusCode: 404,
        message: 'Todo를 찾을 수 없습니다',
      });
    }

    if (todo.userId !== user.id) {
      return reply.code(403).send({
        statusCode: 403,
        message: '이 Todo를 수정할 권한이 없습니다',
      });
    }

    const updatedTodo = await todoRepository.toggleComplete(id);
    
    if (updatedTodo) {
      reply.send(updatedTodo);
    } else {
      reply.code(500).send({
        statusCode: 500,
        message: 'Todo 상태 변경 중 오류가 발생했습니다',
      });
    }
  });
}