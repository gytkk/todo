import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';

export class TestHelper {
  private static instance: TestHelper;
  private prisma: PrismaClient;
  private app: FastifyInstance | null = null;

  private constructor() {
    // Use a separate test database
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://todouser:todopass123@localhost:5432/todoapp_test?schema=public'
        }
      }
    });
  }

  static getInstance(): TestHelper {
    if (!TestHelper.instance) {
      TestHelper.instance = new TestHelper();
    }
    return TestHelper.instance;
  }

  async beforeAll(): Promise<void> {
    // Connect to database
    await this.prisma.$connect();
    
    // Build the Fastify app
    this.app = await buildApp({
      logger: false, // Disable logging in tests
    });

    // Override the prisma instance to use our test instance
    this.app.decorate('prisma', this.prisma);
  }

  async afterAll(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
    await this.prisma.$disconnect();
  }

  async beforeEach(): Promise<void> {
    // Clean up the database before each test
    await this.cleanDatabase();
  }

  async afterEach(): Promise<void> {
    // Clean up after each test
    await this.cleanDatabase();
  }

  private async cleanDatabase(): Promise<void> {
    // Clean up in order to respect foreign key constraints
    await this.prisma.todo.deleteMany({});
    await this.prisma.category.deleteMany({});
    await this.prisma.userSettings.deleteMany({});
    await this.prisma.user.deleteMany({});
  }

  getApp(): FastifyInstance {
    if (!this.app) {
      throw new Error('App not initialized. Call beforeAll() first.');
    }
    return this.app;
  }

  getPrisma(): PrismaClient {
    return this.prisma;
  }

  // Helper to create test data
  async createTestUser(userData?: {
    email?: string;
    name?: string;
    password?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: userData?.email || 'test@example.com',
        name: userData?.name || 'Test User',
        password: userData?.password || '$2a$10$hashedpassword', // Pre-hashed for testing
      },
    });
  }

  async createTestCategory(userId: string, categoryData?: {
    name?: string;
    color?: string;
    isDefault?: boolean;
  }) {
    return this.prisma.category.create({
      data: {
        name: categoryData?.name || 'Test Category',
        color: categoryData?.color || '#3b82f6',
        isDefault: categoryData?.isDefault || false,
        order: 0,
        userId,
      },
    });
  }

  async createTestTodo(userId: string, categoryId: string, todoData?: {
    title?: string;
    date?: Date;
    completed?: boolean;
    todoType?: 'EVENT' | 'TASK';
  }) {
    return this.prisma.todo.create({
      data: {
        title: todoData?.title || 'Test Todo',
        date: todoData?.date || new Date(),
        completed: todoData?.completed || false,
        todoType: todoData?.todoType || 'EVENT',
        userId,
        categoryId,
      },
    });
  }
}