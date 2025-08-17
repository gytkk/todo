import { FastifyInstance } from 'fastify';
import { BasePostgresRepository } from '../base-postgres.repository.js';
import { PaginatedResult, PaginationOptions } from '../interfaces/repository.interface.js';
import { Prisma, Todo, TodoType } from '@prisma/client';

// Helper functions to transform between frontend (lowercase) and database (uppercase) TodoType values
function transformTodoTypeToDb(todoType?: string): TodoType {
  if (!todoType) return TodoType.event;
  return todoType === 'event' ? TodoType.event : TodoType.task;
}

function transformTodoTypeFromDb(todoType: TodoType): string {
  return todoType === TodoType.event ? 'event' : 'task';
}

// Transform todo object from database format to frontend format
function transformTodoFromDb<T extends { todoType: TodoType }>(todo: T | null): T | null {
  if (!todo) return todo;
  return {
    ...todo,
    todoType: transformTodoTypeFromDb(todo.todoType) as TodoType
  };
}

// Transform array of todos from database format to frontend format
function transformTodosFromDb<T extends { todoType: TodoType }>(todos: T[]): T[] {
  return todos.map(transformTodoFromDb) as T[];
}

export interface CreateTodoDto {
  title: string;
  date: Date;
  completed?: boolean;
  todoType?: string; // Changed to string to accept frontend values
  userId: string;
  categoryId: string;
}

export interface TodoWithCategory extends Todo {
  category: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
}

export interface TodoFilterOptions {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  completed?: boolean;
  todoType?: string; // Changed to string to accept frontend values
}

export class TodoPostgresRepository extends BasePostgresRepository<Todo> {
  protected tableName = 'todos';

  constructor(app: FastifyInstance) {
    super(app);
  }

  async findById(id: string): Promise<Todo | null> {
    try {
      const todo = await this.prisma.todo.findUnique({
        where: { id },
      });
      return transformTodoFromDb(todo) as Todo;
    } catch (error) {
      console.error('Error finding todo by id:', error);
      return null;
    }
  }

  async findByIdWithCategory(id: string): Promise<TodoWithCategory | null> {
    try {
      const todo = await this.prisma.todo.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
      });
      return transformTodoFromDb(todo) as TodoWithCategory | null;
    } catch (error) {
      console.error('Error finding todo with category by id:', error);
      return null;
    }
  }

  async findAll(): Promise<Todo[]> {
    try {
      const todos = await this.prisma.todo.findMany({
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });
      return transformTodosFromDb(todos);
    } catch (error) {
      console.error('Error finding all todos:', error);
      return [];
    }
  }

  async findAllWithCategories(): Promise<TodoWithCategory[]> {
    try {
      const todos = await this.prisma.todo.findMany({
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });
      return transformTodosFromDb(todos) as TodoWithCategory[];
    } catch (error) {
      console.error('Error finding all todos with categories:', error);
      return [];
    }
  }

  async findByFilter(filter: TodoFilterOptions): Promise<TodoWithCategory[]> {
    try {
      const where: Prisma.TodoWhereInput = {
        userId: filter.userId,
      };

      if (filter.startDate || filter.endDate) {
        where.date = {};
        if (filter.startDate) {
          where.date.gte = filter.startDate;
        }
        if (filter.endDate) {
          where.date.lte = filter.endDate;
        }
      }

      if (filter.categoryId) {
        where.categoryId = filter.categoryId;
      }

      if (filter.completed !== undefined) {
        where.completed = filter.completed;
      }

      if (filter.todoType) {
        where.todoType = transformTodoTypeToDb(filter.todoType as string);
      }

      const todos = await this.prisma.todo.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });

      return transformTodosFromDb(todos) as TodoWithCategory[];
    } catch (error) {
      console.error('Error finding todos by filter:', error);
      return [];
    }
  }

  async findByIds(ids: string[]): Promise<Todo[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      const todos = await this.prisma.todo.findMany({
        where: {
          id: { in: ids },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });
      return transformTodosFromDb(todos);
    } catch (error) {
      console.error('Error finding todos by ids:', error);
      return [];
    }
  }

  async create(entity: Partial<Todo>): Promise<Todo> {
    try {
      const transformedEntity = { ...entity };
      if (entity.todoType) {
        transformedEntity.todoType = transformTodoTypeToDb(entity.todoType as string);
      }
      
      const todo = await this.prisma.todo.create({
        data: transformedEntity as Prisma.TodoCreateInput,
      });
      const transformedTodo = transformTodoFromDb(todo);
      if (!transformedTodo) {
        throw new Error('Failed to transform created todo');
      }
      return transformedTodo;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw new Error('Failed to create todo');
    }
  }

  async createTodo(todoData: CreateTodoDto): Promise<Todo> {
    try {
      const todo = await this.prisma.todo.create({
        data: {
          title: todoData.title,
          date: todoData.date,
          completed: todoData.completed ?? false,
          todoType: transformTodoTypeToDb(todoData.todoType as string),
          userId: todoData.userId,
          categoryId: todoData.categoryId,
        },
      });
      const transformedTodo = transformTodoFromDb(todo);
      if (!transformedTodo) {
        throw new Error('Failed to transform created todo');
      }
      return transformedTodo;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw new Error('Failed to create todo');
    }
  }

  async update(id: string, updates: Partial<Todo>): Promise<Todo | null> {
    try {
      // Transform todoType if it's being updated
      const transformedUpdates = { ...updates };
      if (updates.todoType) {
        transformedUpdates.todoType = transformTodoTypeToDb(updates.todoType as string);
      }
      
      const todo = await this.prisma.todo.update({
        where: { id },
        data: transformedUpdates,
      });
      return transformTodoFromDb(todo) as Todo;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          return null;
        }
      }
      console.error('Error updating todo:', error);
      throw new Error('Failed to update todo');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.todo.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          return false;
        }
      }
      console.error('Error deleting todo:', error);
      return false;
    }
  }

  async deleteAllByUserId(userId: string): Promise<boolean> {
    try {
      await this.prisma.todo.deleteMany({
        where: { userId },
      });
      return true;
    } catch (error) {
      console.error('Error deleting all todos for user:', error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const todo = await this.prisma.todo.findUnique({
        where: { id },
        select: { id: true },
      });
      return todo !== null;
    } catch (error) {
      console.error('Error checking todo existence:', error);
      return false;
    }
  }

  async findPaginated(options: PaginationOptions & { userId?: string }): Promise<PaginatedResult<Todo>> {
    const { page, limit, userId } = options;
    const offset = (page - 1) * limit;

    try {
      const whereClause = userId ? { userId } : {};
      
      const [items, total] = await Promise.all([
        this.prisma.todo.findMany({
          where: whereClause,
          skip: offset,
          take: limit,
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        }),
        this.prisma.todo.count({ where: whereClause }),
      ]);

      return {
        items: transformTodosFromDb(items),
        total,
        page,
        limit,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      };
    } catch (error) {
      console.error('Error finding paginated todos:', error);
      return {
        items: [],
        total: 0,
        page,
        limit,
        hasNext: false,
        hasPrev: false,
      };
    }
  }

  async toggleComplete(id: string): Promise<Todo | null> {
    try {
      const todo = await this.findById(id);
      if (!todo) {
        return null;
      }

      return await this.update(id, { completed: !todo.completed });
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      return null;
    }
  }

  async findIncompleteTasks(userId: string, beforeDate: Date): Promise<Todo[]> {
    try {
      const todos = await this.prisma.todo.findMany({
        where: {
          userId,
          completed: false,
          todoType: TodoType.task,
          date: { lt: beforeDate },
        },
        orderBy: { date: 'asc' },
      });
      return transformTodosFromDb(todos);
    } catch (error) {
      console.error('Error finding incomplete tasks:', error);
      return [];
    }
  }

  async moveTasks(userId: string, taskIds: string[], newDate: Date): Promise<boolean> {
    try {
      await this.prisma.todo.updateMany({
        where: {
          id: { in: taskIds },
          userId, // Ensure user owns the tasks
        },
        data: {
          date: newDate,
        },
      });
      return true;
    } catch (error) {
      console.error('Error moving tasks:', error);
      return false;
    }
  }

  async getStatsByUserId(userId: string): Promise<{
    total: number;
    completed: number;
    incomplete: number;
    byType: {
      event: { total: number; completed: number; incomplete: number };
      task: { total: number; completed: number; incomplete: number };
    };
  }> {
    try {
      const [total, completed, eventStats, taskStats] = await Promise.all([
        this.prisma.todo.count({ where: { userId } }),
        this.prisma.todo.count({ where: { userId, completed: true } }),
        this.prisma.todo.groupBy({
          by: ['completed'],
          where: { userId, todoType: TodoType.event },
          _count: { id: true },
        }),
        this.prisma.todo.groupBy({
          by: ['completed'],
          where: { userId, todoType: TodoType.task },
          _count: { id: true },
        }),
      ]);

      const eventCompleted = eventStats.find(s => s.completed)?._count.id || 0;
      const eventTotal = eventStats.reduce((sum, s) => sum + s._count.id, 0);
      const taskCompleted = taskStats.find(s => s.completed)?._count.id || 0;
      const taskTotal = taskStats.reduce((sum, s) => sum + s._count.id, 0);

      return {
        total,
        completed,
        incomplete: total - completed,
        byType: {
          event: {
            total: eventTotal,
            completed: eventCompleted,
            incomplete: eventTotal - eventCompleted,
          },
          task: {
            total: taskTotal,
            completed: taskCompleted,
            incomplete: taskTotal - taskCompleted,
          },
        },
      };
    } catch (error) {
      console.error('Error getting todo stats:', error);
      return {
        total: 0,
        completed: 0,
        incomplete: 0,
        byType: {
          event: { total: 0, completed: 0, incomplete: 0 },
          task: { total: 0, completed: 0, incomplete: 0 },
        },
      };
    }
  }

  protected async count(where?: Prisma.TodoWhereInput): Promise<number> {
    try {
      return await this.prisma.todo.count({ where });
    } catch (error) {
      console.error('Error counting todos:', error);
      return 0;
    }
  }
}