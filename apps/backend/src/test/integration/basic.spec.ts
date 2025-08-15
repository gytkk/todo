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

      // Check if default category was created
      const prisma = testHelper.getPrisma();
      const categories = await prisma.category.findMany({
        where: { userId: response.user.id }
      });
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('개인');
      expect(categories[0].isDefault).toBe(true);
      expect(categories[0].color).toBe('#3b82f6');

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

    it('should validate access token', async () => {
      const app = testHelper.getApp();
      
      // Register and login user first
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'validate@example.com',
          password: 'ValidatePassword123!',
          name: 'Validate User'
        }
      });

      expect(registerResponse.statusCode).toBe(201);

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'validate@example.com',
          password: 'ValidatePassword123!'
        }
      });

      expect(loginResponse.statusCode).toBe(200);
      const loginResult = loginResponse.json();
      const { accessToken } = loginResult;

      // Validate token
      const validateResponse = await app.inject({
        method: 'GET',
        url: '/auth/validate',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(validateResponse.statusCode).toBe(200);
      const validateResult = validateResponse.json();
      expect(validateResult.valid).toBe(true);
      expect(validateResult.user).toHaveProperty('id');
      expect(validateResult.user).toHaveProperty('email', 'validate@example.com');
      expect(validateResult.user).toHaveProperty('name', 'Validate User');
      expect(validateResult.user).not.toHaveProperty('password'); // Should not include password
    });

    it('should reject invalid token', async () => {
      const app = testHelper.getApp();
      
      const validateResponse = await app.inject({
        method: 'GET',
        url: '/auth/validate',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(validateResponse.statusCode).toBe(401);
    });

    it('should require authentication header', async () => {
      const app = testHelper.getApp();
      
      const validateResponse = await app.inject({
        method: 'GET',
        url: '/auth/validate'
      });

      expect(validateResponse.statusCode).toBe(401);
    });

    it('should refresh access token', async () => {
      const app = testHelper.getApp();
      
      // Register and login user first
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'refresh@example.com',
          password: 'RefreshPassword123!',
          name: 'Refresh User'
        }
      });

      expect(registerResponse.statusCode).toBe(201);

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'refresh@example.com',
          password: 'RefreshPassword123!'
        }
      });

      expect(loginResponse.statusCode).toBe(200);
      const loginResult = loginResponse.json();
      const { refreshToken } = loginResult;

      // Refresh token
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken
        }
      });

      expect(refreshResponse.statusCode).toBe(200);
      const refreshResult = refreshResponse.json();
      expect(refreshResult).toHaveProperty('accessToken');
      expect(refreshResult).toHaveProperty('refreshToken');
      expect(refreshResult.accessToken).not.toBe(loginResult.accessToken); // Should be different token
      expect(refreshResult.refreshToken).not.toBe(refreshToken); // Should be different refresh token
    });

    it('should reject invalid refresh token', async () => {
      const app = testHelper.getApp();
      
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'invalid-refresh-token'
        }
      });

      expect(refreshResponse.statusCode).toBe(401);
    });
  });
});