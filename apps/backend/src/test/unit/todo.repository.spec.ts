import { TodoPostgresRepository } from '../../repositories/postgres/todo.repository.js';
import { FastifyInstance } from 'fastify';
import { createMockApp } from '../mocks/prisma.mock.js';
import { PrismaClient, TodoType, Prisma, Todo } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

describe('TodoPostgresRepository - Unit Tests', () => {
  let todoRepository: TodoPostgresRepository;
  let mockApp: FastifyInstance;
  let mockPrisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockApp = createMockApp();
    mockPrisma = mockApp.prisma as DeepMockProxy<PrismaClient>;
    todoRepository = new TodoPostgresRepository(mockApp);
  });

  afterEach(() => {
    // Mock cleanup handled by jest-mock-extended
  });

  describe('findById', () => {
    it('should return todo when found', async () => {
      // Arrange
      const todoId = 'todo-id';
      const mockTodo = {
        id: todoId,
        title: 'Test Todo',
        date: new Date(),
        completed: false,
        todoType: 'event' as TodoType,
        userId: 'user-id',
        categoryId: 'category-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.todo.findUnique.mockResolvedValue(mockTodo);

      // Act
      const result = await todoRepository.findById(todoId);

      // Assert
      expect(mockPrisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: todoId }
      });
      expect(result).toEqual(mockTodo);
    });

    it('should return null when todo not found', async () => {
      // Arrange
      const todoId = 'non-existent-id';
      mockPrisma.todo.findUnique.mockResolvedValue(null);

      // Act
      const result = await todoRepository.findById(todoId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when database error occurs', async () => {
      // Arrange
      const todoId = 'todo-id';
      mockPrisma.todo.findUnique.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await todoRepository.findById(todoId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByIdWithCategory', () => {
    it('should return todo with category when found', async () => {
      // Arrange
      const todoId = 'todo-id';
      const mockTodoWithCategory = {
        id: todoId,
        title: 'Test Todo',
        date: new Date(),
        completed: false,
        todoType: 'event' as TodoType,
        userId: 'user-id',
        categoryId: 'category-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 'category-id',
          name: 'Test Category',
          color: '#ff0000',
          icon: 'work'
        }
      };

      mockPrisma.todo.findUnique.mockResolvedValue(mockTodoWithCategory);

      // Act
      const result = await todoRepository.findByIdWithCategory(todoId);

      // Assert
      expect(mockPrisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: todoId },
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
      expect(result).toEqual(mockTodoWithCategory);
    });

    it('should return null when database error occurs', async () => {
      // Arrange
      const todoId = 'todo-id';
      mockPrisma.todo.findUnique.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await todoRepository.findByIdWithCategory(todoId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByFilter', () => {
    it('should filter todos by user ID', async () => {
      // Arrange
      const filter = { userId: 'user-id' };
      const mockTodos = [
        {
          id: 'todo-1',
          title: 'Todo 1',
          date: new Date(),
          completed: false,
          todoType: 'event' as TodoType,
          userId: 'user-id',
          categoryId: 'category-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          category: {
            id: 'category-id',
            name: 'Test Category',
            color: '#ff0000',
            icon: 'work'
          }
        }
      ];

      mockPrisma.todo.findMany.mockResolvedValue(mockTodos);

      // Act
      const result = await todoRepository.findByFilter(filter);

      // Assert
      expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
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
      expect(result).toEqual(mockTodos);
    });

    it('should filter todos by date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const filter = {
        userId: 'user-id',
        startDate,
        endDate
      };

      mockPrisma.todo.findMany.mockResolvedValue([]);

      // Act
      await todoRepository.findByFilter(filter);

      // Assert
      expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          date: {
            gte: startDate,
            lte: endDate
          }
        },
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
    });

    it('should filter todos by category', async () => {
      // Arrange
      const filter = {
        userId: 'user-id',
        categoryId: 'category-id'
      };

      mockPrisma.todo.findMany.mockResolvedValue([]);

      // Act
      await todoRepository.findByFilter(filter);

      // Assert
      expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          categoryId: 'category-id'
        },
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
    });

    it('should filter todos by completion status', async () => {
      // Arrange
      const filter = {
        userId: 'user-id',
        completed: true
      };

      mockPrisma.todo.findMany.mockResolvedValue([]);

      // Act
      await todoRepository.findByFilter(filter);

      // Assert
      expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          completed: true
        },
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
    });

    it('should filter todos by todo type', async () => {
      // Arrange
      const filter = {
        userId: 'user-id',
        todoType: 'task' as TodoType
      };

      mockPrisma.todo.findMany.mockResolvedValue([]);

      // Act
      await todoRepository.findByFilter(filter);

      // Assert
      expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          todoType: 'task' as TodoType
        },
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
    });

    it('should return empty array when database error occurs', async () => {
      // Arrange
      const filter = { userId: 'user-id' };
      mockPrisma.todo.findMany.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await todoRepository.findByFilter(filter);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new todo with all fields', async () => {
      // Arrange
      const todoData = {
        title: 'New Todo',
        date: new Date(),
        completed: false,
        todoType: 'event' as TodoType,
        userId: 'user-id',
        categoryId: 'category-id'
      };

      const createdTodo = {
        id: 'todo-id',
        ...todoData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.todo.create.mockResolvedValue(createdTodo);

      // Act
      const result = await todoRepository.create(todoData);

      // Assert
      expect(mockPrisma.todo.create).toHaveBeenCalledWith({
        data: todoData
      });
      expect(result).toEqual(createdTodo);
    });

    it('should create a todo with default values', async () => {
      // Arrange
      const todoData = {
        title: 'New Todo',
        date: new Date(),
        userId: 'user-id',
        categoryId: 'category-id'
      };

      const createdTodo = {
        id: 'todo-id',
        ...todoData,
        completed: false,
        todoType: 'event' as TodoType,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.todo.create.mockResolvedValue(createdTodo);

      // Act
      const result = await todoRepository.create(todoData);

      // Assert
      expect(mockPrisma.todo.create).toHaveBeenCalledWith({
        data: todoData
      });
      expect(result).toEqual(createdTodo);
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const todoData = {
        title: 'New Todo',
        date: new Date(),
        userId: 'user-id',
        categoryId: 'category-id'
      };

      mockPrisma.todo.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(todoRepository.create(todoData)).rejects.toThrow('Failed to create todo');
    });
  });

  describe('update', () => {
    it('should update todo successfully', async () => {
      // Arrange
      const todoId = 'todo-id';
      const updates = {
        title: 'Updated Title',
        completed: true
      };

      const updatedTodo = {
        id: todoId,
        title: 'Updated Title',
        date: new Date(),
        completed: true,
        todoType: 'event' as TodoType,
        userId: 'user-id',
        categoryId: 'category-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.todo.update.mockResolvedValue(updatedTodo);

      // Act
      const result = await todoRepository.update(todoId, updates);

      // Assert
      expect(mockPrisma.todo.update).toHaveBeenCalledWith({
        where: { id: todoId },
        data: updates
      });
      expect(result).toEqual(updatedTodo);
    });

    it('should return null when todo not found', async () => {
      // Arrange
      const todoId = 'non-existent-id';
      const updates = { title: 'Updated Title' };

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0'
        }
      );

      mockPrisma.todo.update.mockRejectedValue(prismaError);

      // Act
      const result = await todoRepository.update(todoId, updates);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      // Arrange
      const todoId = 'todo-id';
      const updates = { title: 'Updated Title' };

      mockPrisma.todo.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(todoRepository.update(todoId, updates)).rejects.toThrow('Failed to update todo');
    });
  });

  describe('delete', () => {
    it('should delete todo successfully', async () => {
      // Arrange
      const todoId = 'todo-id';
      mockPrisma.todo.delete.mockResolvedValue({} as Todo);

      // Act
      const result = await todoRepository.delete(todoId);

      // Assert
      expect(mockPrisma.todo.delete).toHaveBeenCalledWith({
        where: { id: todoId }
      });
      expect(result).toBe(true);
    });

    it('should return false when todo not found', async () => {
      // Arrange
      const todoId = 'non-existent-id';

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0'
        }
      );

      mockPrisma.todo.delete.mockRejectedValue(prismaError);

      // Act
      const result = await todoRepository.delete(todoId);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for other database errors', async () => {
      // Arrange
      const todoId = 'todo-id';
      mockPrisma.todo.delete.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await todoRepository.delete(todoId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toggleComplete', () => {
    it('should toggle completion status from false to true', async () => {
      // Arrange
      const todoId = 'todo-id';
      const existingTodo = {
        id: todoId,
        title: 'Test Todo',
        date: new Date(),
        completed: false,
        todoType: 'event' as TodoType,
        userId: 'user-id',
        categoryId: 'category-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedTodo = { ...existingTodo, completed: true };

      mockPrisma.todo.findUnique.mockResolvedValue(existingTodo);
      mockPrisma.todo.update.mockResolvedValue(updatedTodo);

      // Act
      const result = await todoRepository.toggleComplete(todoId);

      // Assert
      expect(mockPrisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: todoId }
      });
      expect(mockPrisma.todo.update).toHaveBeenCalledWith({
        where: { id: todoId },
        data: { completed: true }
      });
      expect(result).toEqual(updatedTodo);
    });

    it('should toggle completion status from true to false', async () => {
      // Arrange
      const todoId = 'todo-id';
      const existingTodo = {
        id: todoId,
        title: 'Test Todo',
        date: new Date(),
        completed: true,
        todoType: 'event' as TodoType,
        userId: 'user-id',
        categoryId: 'category-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedTodo = { ...existingTodo, completed: false };

      mockPrisma.todo.findUnique.mockResolvedValue(existingTodo);
      mockPrisma.todo.update.mockResolvedValue(updatedTodo);

      // Act
      const result = await todoRepository.toggleComplete(todoId);

      // Assert
      expect(mockPrisma.todo.update).toHaveBeenCalledWith({
        where: { id: todoId },
        data: { completed: false }
      });
      expect(result).toEqual(updatedTodo);
    });

    it('should return null when todo not found', async () => {
      // Arrange
      const todoId = 'non-existent-id';
      mockPrisma.todo.findUnique.mockResolvedValue(null);

      // Act
      const result = await todoRepository.toggleComplete(todoId);

      // Assert
      expect(result).toBeNull();
      expect(mockPrisma.todo.update).not.toHaveBeenCalled();
    });

    it('should return null when update fails', async () => {
      // Arrange
      const todoId = 'todo-id';
      const existingTodo = {
        id: todoId,
        title: 'Test Todo',
        date: new Date(),
        completed: false,
        todoType: 'event' as TodoType,
        userId: 'user-id',
        categoryId: 'category-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.todo.findUnique.mockResolvedValue(existingTodo);
      mockPrisma.todo.update.mockRejectedValue(new Error('Update failed'));

      // Act
      const result = await todoRepository.toggleComplete(todoId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findIncompleteTasks', () => {
    it('should return incomplete tasks before given date', async () => {
      // Arrange
      const userId = 'user-id';
      const beforeDate = new Date('2024-01-15');
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Old Task 1',
          date: new Date('2024-01-10'),
          completed: false,
          todoType: 'task' as TodoType,
          userId,
          categoryId: 'category-id',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'task-2',
          title: 'Old Task 2',
          date: new Date('2024-01-12'),
          completed: false,
          todoType: 'task' as TodoType,
          userId,
          categoryId: 'category-id',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.todo.findMany.mockResolvedValue(mockTasks);

      // Act
      const result = await todoRepository.findIncompleteTasks(userId, beforeDate);

      // Assert
      expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          completed: false,
          todoType: 'task' as TodoType,
          date: { lt: beforeDate }
        },
        orderBy: { date: 'asc' }
      });
      expect(result).toEqual(mockTasks);
    });

    it('should return empty array when database error occurs', async () => {
      // Arrange
      const userId = 'user-id';
      const beforeDate = new Date();
      mockPrisma.todo.findMany.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await todoRepository.findIncompleteTasks(userId, beforeDate);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('moveTasks', () => {
    it('should move tasks to new date', async () => {
      // Arrange
      const userId = 'user-id';
      const taskIds = ['task-1', 'task-2'];
      const newDate = new Date('2024-02-15');

      mockPrisma.todo.updateMany.mockResolvedValue({ count: 2 });

      // Act
      const result = await todoRepository.moveTasks(userId, taskIds, newDate);

      // Assert
      expect(mockPrisma.todo.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: taskIds },
          userId
        },
        data: {
          date: newDate
        }
      });
      expect(result).toBe(true);
    });

    it('should return false when database error occurs', async () => {
      // Arrange
      const userId = 'user-id';
      const taskIds = ['task-1'];
      const newDate = new Date();
      mockPrisma.todo.updateMany.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await todoRepository.moveTasks(userId, taskIds, newDate);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getStatsByUserId', () => {
    it('should return correct statistics', async () => {
      // Arrange
      const userId = 'user-id';

      mockPrisma.todo.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(6); // completed

      mockPrisma.todo.groupBy
        .mockResolvedValueOnce([ // event stats
          { completed: true, _count: { id: 3 } },
          { completed: false, _count: { id: 2 } }
        ] as Parameters<typeof mockPrisma.todo.groupBy.mockResolvedValueOnce>[0])
        .mockResolvedValueOnce([ // task stats
          { completed: true, _count: { id: 3 } },
          { completed: false, _count: { id: 2 } }
        ] as Parameters<typeof mockPrisma.todo.groupBy.mockResolvedValueOnce>[0]);

      // Act
      const result = await todoRepository.getStatsByUserId(userId);

      // Assert
      expect(mockPrisma.todo.count).toHaveBeenCalledWith({ where: { userId } });
      expect(mockPrisma.todo.count).toHaveBeenCalledWith({ where: { userId, completed: true } });

      expect(mockPrisma.todo.groupBy).toHaveBeenCalledWith({
        by: ['completed'],
        where: { userId, todoType: 'event' as TodoType },
        _count: { id: true }
      });
      expect(mockPrisma.todo.groupBy).toHaveBeenCalledWith({
        by: ['completed'],
        where: { userId, todoType: 'task' as TodoType },
        _count: { id: true }
      });

      expect(result).toEqual({
        total: 10,
        completed: 6,
        incomplete: 4,
        byType: {
          event: {
            total: 5, // 3 + 2
            completed: 3,
            incomplete: 2
          },
          task: {
            total: 5, // 3 + 2
            completed: 3,
            incomplete: 2
          }
        }
      });
    });

    it('should return zero stats when database error occurs', async () => {
      // Arrange
      const userId = 'user-id';
      mockPrisma.todo.count.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await todoRepository.getStatsByUserId(userId);

      // Assert
      expect(result).toEqual({
        total: 0,
        completed: 0,
        incomplete: 0,
        byType: {
          event: { total: 0, completed: 0, incomplete: 0 },
          task: { total: 0, completed: 0, incomplete: 0 }
        }
      });
    });

    it('should handle empty stats gracefully', async () => {
      // Arrange
      const userId = 'user-id';

      mockPrisma.todo.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0); // completed

      mockPrisma.todo.groupBy
        .mockResolvedValueOnce([]) // event stats
        .mockResolvedValueOnce([]); // task stats

      // Act
      const result = await todoRepository.getStatsByUserId(userId);

      // Assert
      expect(result).toEqual({
        total: 0,
        completed: 0,
        incomplete: 0,
        byType: {
          event: { total: 0, completed: 0, incomplete: 0 },
          task: { total: 0, completed: 0, incomplete: 0 }
        }
      });
    });
  });

  describe('deleteAllByUserId', () => {
    it('should delete all todos for user', async () => {
      // Arrange
      const userId = 'user-id';
      mockPrisma.todo.deleteMany.mockResolvedValue({ count: 5 });

      // Act
      const result = await todoRepository.deleteAllByUserId(userId);

      // Assert
      expect(mockPrisma.todo.deleteMany).toHaveBeenCalledWith({
        where: { userId }
      });
      expect(result).toBe(true);
    });

    it('should return false when database error occurs', async () => {
      // Arrange
      const userId = 'user-id';
      mockPrisma.todo.deleteMany.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await todoRepository.deleteAllByUserId(userId);

      // Assert
      expect(result).toBe(false);
    });
  });
});
