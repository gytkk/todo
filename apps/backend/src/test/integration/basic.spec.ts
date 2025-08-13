import { TestHelper } from '../setup.js';

describe('Basic Integration Tests', () => {
  let testHelper: TestHelper;

  beforeAll(async () => {
    testHelper = TestHelper.getInstance();
    await testHelper.beforeAll();
  });

  afterAll(async () => {
    await testHelper.afterAll();
  });

  beforeEach(async () => {
    await testHelper.beforeEach();
  });

  afterEach(async () => {
    await testHelper.afterEach();
  });

  describe('Database Connection', () => {
    it('should connect to PostgreSQL', async () => {
      const prisma = testHelper.getPrisma();
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toEqual([{ test: 1 }]);
    });

    it('should have required tables', async () => {
      const prisma = testHelper.getPrisma();
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

      const tableNames = tables.map(t => t.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('categories');
      expect(tableNames).toContain('todos');
      expect(tableNames).toContain('user_settings');
    });
  });

  describe('Basic CRUD Operations', () => {
    it('should create, read, update, delete user', async () => {
      const prisma = testHelper.getPrisma();
      
      // Create
      const user = await prisma.user.create({
        data: {
          email: 'crud@example.com',
          name: 'CRUD User',
          password: 'hashedpassword'
        }
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('crud@example.com');

      // Read
      const foundUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(foundUser).not.toBeNull();
      expect(foundUser?.name).toBe('CRUD User');

      // Update
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated CRUD User' }
      });
      expect(updatedUser.name).toBe('Updated CRUD User');

      // Delete
      await prisma.user.delete({ where: { id: user.id } });
      
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(deletedUser).toBeNull();
    });

    it('should create related data (user -> category -> todo)', async () => {
      const prisma = testHelper.getPrisma();
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: 'relations@example.com',
          name: 'Relations User',
          password: 'hashedpassword'
        }
      });

      // Create category
      const category = await prisma.category.create({
        data: {
          name: 'Test Category',
          color: '#ff0000',
          userId: user.id
        }
      });

      // Create todo
      const todo = await prisma.todo.create({
        data: {
          title: 'Test Todo',
          date: new Date(),
          userId: user.id,
          categoryId: category.id
        }
      });

      // Verify relationships
      expect(category.userId).toBe(user.id);
      expect(todo.userId).toBe(user.id);
      expect(todo.categoryId).toBe(category.id);

      // Test cascade delete
      await prisma.user.delete({ where: { id: user.id } });
      
      const remainingCategory = await prisma.category.findUnique({
        where: { id: category.id }
      });
      const remainingTodo = await prisma.todo.findUnique({
        where: { id: todo.id }
      });
      
      expect(remainingCategory).toBeNull();
      expect(remainingTodo).toBeNull();
    });
  });

  describe('API Health Check', () => {
    it('should return health status', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result).toHaveProperty('status', 'ok');
    });

    it('should return database health status', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/health/database'
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.status).toBe('ok');
      expect(result.database).toBe('postgresql');
      expect(result.connected).toBe(true);
    });
  });

  describe('Authentication Flow', () => {
    it('should register and login user', async () => {
      const app = testHelper.getApp();
      
      // Register
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'authflow@example.com',
          password: 'SecurePassword123!',
          name: 'Auth Flow User'
        }
      });

      expect(registerResponse.statusCode).toBe(201);
      const response = registerResponse.json();
      expect(response.user.email).toBe('authflow@example.com');

      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'authflow@example.com',
          password: 'SecurePassword123!'
        }
      });

      expect(loginResponse.statusCode).toBe(200);
      const loginResult = loginResponse.json();
      expect(loginResult).toHaveProperty('accessToken');
      expect(loginResult).toHaveProperty('user');
      expect(loginResult.user.email).toBe('authflow@example.com');
    });
  });
});