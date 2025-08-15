import { TestHelper } from '../setup.js';

describe('User Settings Integration Tests', () => {
  let testHelper: TestHelper;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    testHelper = TestHelper.getInstance();
    await testHelper.beforeAll();
  });

  afterAll(async () => {
    await testHelper.afterAll();
  });

  beforeEach(async () => {
    await testHelper.beforeEach();
    
    // Create test user and get auth token
    const app = testHelper.getApp();
    
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'settings-test@example.com',
        password: 'TestPassword123!',
        name: 'Settings Test User'
      }
    });
    
    expect(registerResponse.statusCode).toBe(201);
    
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'settings-test@example.com',
        password: 'TestPassword123!'
      }
    });
    
    expect(loginResponse.statusCode).toBe(200);
    const loginResult = loginResponse.json();
    authToken = loginResult.accessToken;
    userId = loginResult.user.id;
  });

  afterEach(async () => {
    await testHelper.afterEach();
  });

  describe('GET /user-settings', () => {
    it('should return default settings for new user', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/user-settings',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const settings = response.json();
      expect(settings).toHaveProperty('id');
      expect(settings.userId).toBe(userId);
      expect(settings.theme).toBe('SYSTEM');
      expect(settings.language).toBe('ko');
      expect(settings.themeColor).toBe('#3b82f6');
      expect(settings.customColor).toBe('#3b82f6');
      expect(settings.defaultView).toBe('month');
      expect(settings.dateFormat).toBe('YYYY-MM-DD');
      expect(settings.timeFormat).toBe('24h');
      expect(settings.timezone).toBe('Asia/Seoul');
      expect(settings.weekStart).toBe('sunday');
      expect(settings.oldTodoDisplayLimit).toBe(30);
      expect(settings.autoMoveTodos).toBe(true);
      expect(settings.showTaskMoveNotifications).toBe(true);
      expect(settings.saturationEnabled).toBe(true);
      expect(settings.saturationLevels).toHaveLength(3);
      expect(settings.completedTodoDisplay).toBe('all');
      expect(settings.showWeekends).toBe(true);
      expect(settings.autoBackup).toBe(false);
      expect(settings.backupInterval).toBe('weekly');
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/user-settings'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should create settings if not exist', async () => {
      const app = testHelper.getApp();
      
      // Verify no settings exist initially
      const prisma = testHelper.getPrisma();
      const existingSettings = await prisma.userSettings.findUnique({
        where: { userId }
      });
      expect(existingSettings).toBeNull();

      const response = await app.inject({
        method: 'GET',
        url: '/user-settings',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const settings = response.json();
      expect(settings.userId).toBe(userId);
      
      // Verify settings were created in database
      const createdSettings = await prisma.userSettings.findUnique({
        where: { userId }
      });
      expect(createdSettings).not.toBeNull();
    });
  });

  describe('PUT /user-settings', () => {
    beforeEach(async () => {
      // Ensure user settings exist
      const app = testHelper.getApp();
      await app.inject({
        method: 'GET',
        url: '/user-settings',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });
    });

    it('should update user settings', async () => {
      const app = testHelper.getApp();
      
      const updateData = {
        theme: 'DARK',
        language: 'en',
        themeColor: '#ff0000',
        customColor: '#00ff00',
        defaultView: 'week',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        timezone: 'UTC',
        weekStart: 'monday',
        oldTodoDisplayLimit: 60,
        autoMoveTodos: false,
        showTaskMoveNotifications: false,
        saturationEnabled: false,
        saturationLevels: [
          { days: 3, opacity: 0.9 },
          { days: 7, opacity: 0.7 }
        ],
        completedTodoDisplay: 'hidden',
        showWeekends: false,
        autoBackup: true,
        backupInterval: 'daily'
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: updateData
      });

      expect(response.statusCode).toBe(200);
      const settings = response.json();
      
      expect(settings.theme).toBe('DARK');
      expect(settings.language).toBe('en');
      expect(settings.themeColor).toBe('#ff0000');
      expect(settings.customColor).toBe('#00ff00');
      expect(settings.defaultView).toBe('week');
      expect(settings.dateFormat).toBe('DD/MM/YYYY');
      expect(settings.timeFormat).toBe('12h');
      expect(settings.timezone).toBe('UTC');
      expect(settings.weekStart).toBe('monday');
      expect(settings.oldTodoDisplayLimit).toBe(60);
      expect(settings.autoMoveTodos).toBe(false);
      expect(settings.showTaskMoveNotifications).toBe(false);
      expect(settings.saturationEnabled).toBe(false);
      expect(settings.saturationLevels).toHaveLength(2);
      expect(settings.completedTodoDisplay).toBe('hidden');
      expect(settings.showWeekends).toBe(false);
      expect(settings.autoBackup).toBe(true);
      expect(settings.backupInterval).toBe('daily');
    });

    it('should allow partial updates', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          theme: 'LIGHT',
          language: 'en'
        }
      });

      expect(response.statusCode).toBe(200);
      const settings = response.json();
      
      expect(settings.theme).toBe('LIGHT');
      expect(settings.language).toBe('en');
      // Other settings should remain default
      expect(settings.timezone).toBe('Asia/Seoul');
      expect(settings.autoMoveTodos).toBe(true);
    });

    it('should validate theme enum', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          theme: 'INVALID_THEME'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings',
        payload: {
          theme: 'DARK'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should create settings if not exist during update', async () => {
      const app = testHelper.getApp();
      
      // Delete existing settings
      const prisma = testHelper.getPrisma();
      await prisma.userSettings.deleteMany({
        where: { userId }
      });

      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          theme: 'DARK'
        }
      });

      expect(response.statusCode).toBe(200);
      const settings = response.json();
      expect(settings.theme).toBe('DARK');
      expect(settings.userId).toBe(userId);
    });
  });

  describe('GET /user-settings/categories', () => {
    it('should return empty array for new user', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const categories = response.json();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toHaveLength(0);
    });

    it('should return user categories ordered by order field', async () => {
      const app = testHelper.getApp();
      
      // Create categories with different orders
      await testHelper.createTestCategory(userId, {
        name: 'Category B',
        color: '#ff0000',
        order: 1
      });
      await testHelper.createTestCategory(userId, {
        name: 'Category A',
        color: '#00ff00',
        order: 0
      });

      const response = await app.inject({
        method: 'GET',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const categories = response.json();
      expect(categories).toHaveLength(2);
      // Should be ordered by order field (0, 1)
      expect(categories[0].name).toBe('Category A');
      expect(categories[1].name).toBe('Category B');
    });

    it('should only return user\'s own categories', async () => {
      const app = testHelper.getApp();
      
      // Create category for current user
      await testHelper.createTestCategory(userId, {
        name: 'My Category'
      });
      
      // Create category for another user
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      await testHelper.createTestCategory(otherUser.id, {
        name: 'Other Category'
      });

      const response = await app.inject({
        method: 'GET',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const categories = response.json();
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('My Category');
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/user-settings/categories'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /user-settings/categories', () => {
    it('should create a new category', async () => {
      const app = testHelper.getApp();
      
      const categoryData = {
        name: 'Work',
        color: '#ff0000',
        icon: 'work',
        isDefault: false
      };

      const response = await app.inject({
        method: 'POST',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: categoryData
      });

      expect(response.statusCode).toBe(201);
      const category = response.json();
      expect(category).toHaveProperty('id');
      expect(category.name).toBe(categoryData.name);
      expect(category.color).toBe(categoryData.color);
      expect(category.icon).toBe(categoryData.icon);
      expect(category.isDefault).toBe(false);
      expect(category.userId).toBe(userId);
      expect(category.order).toBe(0); // First category
    });

    it('should set correct order for new categories', async () => {
      const app = testHelper.getApp();
      
      // Create first category
      const response1 = await app.inject({
        method: 'POST',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'Category 1',
          color: '#ff0000'
        }
      });
      expect(response1.statusCode).toBe(201);
      expect(response1.json().order).toBe(0);

      // Create second category
      const response2 = await app.inject({
        method: 'POST',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'Category 2',
          color: '#00ff00'
        }
      });
      expect(response2.statusCode).toBe(201);
      expect(response2.json().order).toBe(1);
    });

    it('should handle default category setting', async () => {
      const app = testHelper.getApp();
      
      // Create first category as default
      const response1 = await app.inject({
        method: 'POST',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'Default Category',
          color: '#ff0000',
          isDefault: true
        }
      });
      expect(response1.statusCode).toBe(201);
      expect(response1.json().isDefault).toBe(true);

      // Create second category as default (should unset first)
      const response2 = await app.inject({
        method: 'POST',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'New Default',
          color: '#00ff00',
          isDefault: true
        }
      });
      expect(response2.statusCode).toBe(201);
      expect(response2.json().isDefault).toBe(true);

      // Verify first category is no longer default
      const prisma = testHelper.getPrisma();
      const firstCategory = await prisma.category.findUnique({
        where: { id: response1.json().id }
      });
      expect(firstCategory?.isDefault).toBe(false);
    });

    it('should enforce 10 category limit', async () => {
      const app = testHelper.getApp();
      
      // Create 10 categories
      for (let i = 0; i < 10; i++) {
        const response = await app.inject({
          method: 'POST',
          url: '/user-settings/categories',
          headers: {
            authorization: `Bearer ${authToken}`
          },
          payload: {
            name: `Category ${i + 1}`,
            color: '#ff0000'
          }
        });
        expect(response.statusCode).toBe(201);
      }

      // Try to create 11th category
      const response = await app.inject({
        method: 'POST',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'Category 11',
          color: '#ff0000'
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('최대 10개까지');
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'POST',
        url: '/user-settings/categories',
        payload: {
          name: 'Test Category',
          color: '#ff0000'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'POST',
        url: '/user-settings/categories',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          // Missing required name and color
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /user-settings/categories/:id', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await testHelper.createTestCategory(userId, {
        name: 'Original Category',
        color: '#ff0000',
        isDefault: false
      });
      categoryId = category.id;
    });

    it('should update category', async () => {
      const app = testHelper.getApp();
      
      const updateData = {
        name: 'Updated Category',
        color: '#00ff00',
        icon: 'updated',
        isDefault: true
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${categoryId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: updateData
      });

      expect(response.statusCode).toBe(200);
      const category = response.json();
      expect(category.name).toBe(updateData.name);
      expect(category.color).toBe(updateData.color);
      expect(category.icon).toBe(updateData.icon);
      expect(category.isDefault).toBe(true);
    });

    it('should allow partial updates', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${categoryId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'Only Name Updated'
        }
      });

      expect(response.statusCode).toBe(200);
      const category = response.json();
      expect(category.name).toBe('Only Name Updated');
      expect(category.color).toBe('#ff0000'); // Should remain unchanged
    });

    it('should handle default category switching', async () => {
      const app = testHelper.getApp();
      
      // Create another category as default
      const defaultCategory = await testHelper.createTestCategory(userId, {
        name: 'Default Category',
        isDefault: true
      });

      // Update first category to be default
      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${categoryId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          isDefault: true
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().isDefault).toBe(true);

      // Verify previous default category is no longer default
      const prisma = testHelper.getPrisma();
      const previousDefault = await prisma.category.findUnique({
        where: { id: defaultCategory.id }
      });
      expect(previousDefault?.isDefault).toBe(false);
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${categoryId}`,
        payload: {
          name: 'Updated'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent category', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings/categories/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'Updated'
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should deny access to other user\'s category', async () => {
      const app = testHelper.getApp();
      
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);

      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${otherCategory.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'Updated'
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('DELETE /user-settings/categories/:id', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await testHelper.createTestCategory(userId, {
        name: 'Test Category'
      });
      categoryId = category.id;
    });

    it('should delete category', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'DELETE',
        url: `/user-settings/categories/${categoryId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().message).toContain('성공적으로 삭제');

      // Verify category is deleted
      const prisma = testHelper.getPrisma();
      const deletedCategory = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      expect(deletedCategory).toBeNull();
    });

    it('should reorder remaining categories after deletion', async () => {
      const app = testHelper.getApp();
      
      // Create additional categories
      await testHelper.createTestCategory(userId, {
        name: 'Category 1',
        order: 1
      });
      await testHelper.createTestCategory(userId, {
        name: 'Category 2',
        order: 2
      });

      // Delete the first category (order 0)
      const response = await app.inject({
        method: 'DELETE',
        url: `/user-settings/categories/${categoryId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });
      expect(response.statusCode).toBe(200);

      // Verify remaining categories are reordered
      const prisma = testHelper.getPrisma();
      const remainingCategories = await prisma.category.findMany({
        where: { userId },
        orderBy: { order: 'asc' }
      });

      expect(remainingCategories).toHaveLength(2);
      expect(remainingCategories[0].order).toBe(0);
      expect(remainingCategories[1].order).toBe(1);
    });

    it('should prevent deletion if todos exist in category', async () => {
      const app = testHelper.getApp();
      
      // Create a todo in the category
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Test Todo'
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/user-settings/categories/${categoryId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('TODO가 있어');
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'DELETE',
        url: `/user-settings/categories/${categoryId}`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent category', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'DELETE',
        url: '/user-settings/categories/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should deny access to other user\'s category', async () => {
      const app = testHelper.getApp();
      
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);

      const response = await app.inject({
        method: 'DELETE',
        url: `/user-settings/categories/${otherCategory.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /user-settings/categories/available-colors', () => {
    it('should return all colors when no categories exist', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/user-settings/categories/available-colors',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const colors = response.json();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(15); // Should have many available colors
      expect(colors).toContain('#ef4444');
      expect(colors).toContain('#3b82f6');
    });

    it('should exclude used colors', async () => {
      const app = testHelper.getApp();
      
      // Create categories with specific colors
      await testHelper.createTestCategory(userId, {
        name: 'Red Category',
        color: '#ef4444'
      });
      await testHelper.createTestCategory(userId, {
        name: 'Blue Category',
        color: '#3b82f6'
      });

      const response = await app.inject({
        method: 'GET',
        url: '/user-settings/categories/available-colors',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const colors = response.json();
      expect(colors).not.toContain('#ef4444');
      expect(colors).not.toContain('#3b82f6');
      // Should still have other colors available
      expect(colors).toContain('#22c55e');
    });

    it('should only consider current user\'s categories', async () => {
      const app = testHelper.getApp();
      
      // Create category for current user
      await testHelper.createTestCategory(userId, {
        color: '#ef4444'
      });
      
      // Create category for another user with same color
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      await testHelper.createTestCategory(otherUser.id, {
        color: '#3b82f6'
      });

      const response = await app.inject({
        method: 'GET',
        url: '/user-settings/categories/available-colors',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const colors = response.json();
      expect(colors).not.toContain('#ef4444'); // Used by current user
      expect(colors).toContain('#3b82f6'); // Used by other user, available for current user
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/user-settings/categories/available-colors'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /user-settings/categories/:id/filter', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await testHelper.createTestCategory(userId);
      categoryId = category.id;
    });

    it('should set category filter', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${categoryId}/filter`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          enabled: true
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.categoryId).toBe(categoryId);
      expect(result.filterEnabled).toBe(true);
      expect(result.message).toContain('활성화');
    });

    it('should disable category filter', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${categoryId}/filter`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          enabled: false
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.filterEnabled).toBe(false);
      expect(result.message).toContain('비활성화');
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${categoryId}/filter`,
        payload: {
          enabled: true
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${categoryId}/filter`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          // Missing enabled field
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should deny access to other user\'s category', async () => {
      const app = testHelper.getApp();
      
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);

      const response = await app.inject({
        method: 'PUT',
        url: `/user-settings/categories/${otherCategory.id}/filter`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          enabled: true
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /user-settings/categories/reorder', () => {
    let categoryIds: string[];

    beforeEach(async () => {
      // Create multiple categories
      const category1 = await testHelper.createTestCategory(userId, {
        name: 'Category 1',
        order: 0
      });
      const category2 = await testHelper.createTestCategory(userId, {
        name: 'Category 2',
        order: 1
      });
      const category3 = await testHelper.createTestCategory(userId, {
        name: 'Category 3',
        order: 2
      });

      categoryIds = [category1.id, category2.id, category3.id];
    });

    it('should reorder categories', async () => {
      const app = testHelper.getApp();
      
      // Reverse the order
      const newOrder = [categoryIds[2], categoryIds[0], categoryIds[1]];

      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings/categories/reorder',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          categoryIds: newOrder
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.updatedCount).toBe(3);
      expect(result.message).toContain('성공적으로 변경');

      // Verify the new order in database
      const prisma = testHelper.getPrisma();
      const categories = await prisma.category.findMany({
        where: { userId },
        orderBy: { order: 'asc' }
      });

      expect(categories[0].id).toBe(categoryIds[2]); // Category 3 first
      expect(categories[0].order).toBe(0);
      expect(categories[1].id).toBe(categoryIds[0]); // Category 1 second
      expect(categories[1].order).toBe(1);
      expect(categories[2].id).toBe(categoryIds[1]); // Category 2 third
      expect(categories[2].order).toBe(2);
    });

    it('should validate category ownership', async () => {
      const app = testHelper.getApp();
      
      // Create category for another user
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);

      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings/categories/reorder',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          categoryIds: [...categoryIds, otherCategory.id]
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('유효하지 않은 카테고리');
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings/categories/reorder',
        payload: {
          categoryIds: categoryIds
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings/categories/reorder',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          // Missing categoryIds
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle empty categoryIds array', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: '/user-settings/categories/reorder',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          categoryIds: []
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.updatedCount).toBe(0);
    });
  });
});