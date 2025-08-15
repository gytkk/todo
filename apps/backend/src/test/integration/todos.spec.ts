import { TodoType } from '@prisma/client';
import { TestHelper } from '../setup.js';

describe('Todos Integration Tests', () => {
  let testHelper: TestHelper;
  let authToken: string;
  let userId: string;
  let categoryId: string;

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
        email: 'todo-test@example.com',
        password: 'TestPassword123!',
        name: 'Todo Test User'
      }
    });
    
    expect(registerResponse.statusCode).toBe(201);
    
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'todo-test@example.com',
        password: 'TestPassword123!'
      }
    });
    
    expect(loginResponse.statusCode).toBe(200);
    const loginResult = loginResponse.json();
    authToken = loginResult.accessToken;
    userId = loginResult.user.id;
    
    // Create test category
    const category = await testHelper.createTestCategory(userId, {
      name: 'Todo Test Category',
      color: '#ff0000'
    });
    categoryId = category.id;
  });

  afterEach(async () => {
    await testHelper.afterEach();
  });

  describe('GET /todos', () => {
    it('should return empty array when no todos exist', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const todos = response.json();
      expect(Array.isArray(todos)).toBe(true);
      expect(todos).toHaveLength(0);
    });

    it('should return todos with category information', async () => {
      const app = testHelper.getApp();
      
      // Create test todo
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Test Todo',
        date: new Date('2024-01-15')
      });

      const response = await app.inject({
        method: 'GET',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const todos = response.json();
      expect(todos).toHaveLength(1);
      expect(todos[0]).toHaveProperty('title', 'Test Todo');
      expect(todos[0]).toHaveProperty('category');
      expect(todos[0].category).toHaveProperty('name', 'Todo Test Category');
      expect(todos[0].category).toHaveProperty('color', '#ff0000');
    });

    it('should filter todos by date range', async () => {
      const app = testHelper.getApp();
      
      // Create todos with different dates
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Old Todo',
        date: new Date('2024-01-01')
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Recent Todo',
        date: new Date('2024-01-15')
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Future Todo',
        date: new Date('2024-02-01')
      });

      const response = await app.inject({
        method: 'GET',
        url: '/todos?startDate=2024-01-10T00:00:00.000Z&endDate=2024-01-20T23:59:59.999Z',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const todos = response.json();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Recent Todo');
    });

    it('should filter todos by category', async () => {
      const app = testHelper.getApp();
      
      // Create another category
      const category2 = await testHelper.createTestCategory(userId, {
        name: 'Work Category',
        color: '#00ff00'
      });
      
      await testHelper.createTestTodo(userId, categoryId, { title: 'Personal Todo' });
      await testHelper.createTestTodo(userId, category2.id, { title: 'Work Todo' });

      const response = await app.inject({
        method: 'GET',
        url: `/todos?categoryId=${categoryId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const todos = response.json();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Personal Todo');
    });

    it('should filter todos by completion status', async () => {
      const app = testHelper.getApp();
      
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Completed Todo',
        completed: true
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Incomplete Todo',
        completed: false
      });

      const response = await app.inject({
        method: 'GET',
        url: '/todos?completed=true',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const todos = response.json();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Completed Todo');
      expect(todos[0].completed).toBe(true);
    });

    it('should filter todos by todo type', async () => {
      const app = testHelper.getApp();
      
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Event Todo',
        todoType: TodoType.EVENT
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Task Todo',
        todoType: TodoType.TASK
      });

      const response = await app.inject({
        method: 'GET',
        url: '/todos?todoType=TASK',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const todos = response.json();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Task Todo');
      expect(todos[0].todoType).toBe('TASK');
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/todos'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should only return user\'s own todos', async () => {
      const app = testHelper.getApp();
      
      // Create another user
      const user2 = await testHelper.createTestUser({
        email: 'user2@example.com',
        name: 'User 2'
      });
      const category2 = await testHelper.createTestCategory(user2.id);
      await testHelper.createTestTodo(user2.id, category2.id, {
        title: 'Other User Todo'
      });
      
      // Create todo for current user
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'My Todo'
      });

      const response = await app.inject({
        method: 'GET',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const todos = response.json();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('My Todo');
    });
  });

  describe('POST /todos', () => {
    it('should create a new todo', async () => {
      const app = testHelper.getApp();
      
      const todoData = {
        title: 'New Todo',
        date: '2024-01-15T10:00:00.000Z',
        categoryId: categoryId,
        todoType: 'EVENT',
        completed: false
      };

      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: todoData
      });

      expect(response.statusCode).toBe(201);
      const todo = response.json();
      expect(todo).toHaveProperty('id');
      expect(todo.title).toBe(todoData.title);
      expect(todo.userId).toBe(userId);
      expect(todo.categoryId).toBe(categoryId);
      expect(todo.todoType).toBe('EVENT');
      expect(todo.completed).toBe(false);
    });

    it('should create todo with default values', async () => {
      const app = testHelper.getApp();
      
      const todoData = {
        title: 'Simple Todo',
        date: '2024-01-15T10:00:00.000Z',
        categoryId: categoryId
      };

      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: todoData
      });

      expect(response.statusCode).toBe(201);
      const todo = response.json();
      expect(todo.todoType).toBe('EVENT'); // Default value
      expect(todo.completed).toBe(false); // Default value
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        payload: {
          title: 'Test Todo',
          date: '2024-01-15T10:00:00.000Z',
          categoryId: categoryId
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          // Missing required fields
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate category ownership', async () => {
      const app = testHelper.getApp();
      
      // Create category owned by another user
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);

      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          title: 'Test Todo',
          date: '2024-01-15T10:00:00.000Z',
          categoryId: otherCategory.id
        }
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toContain('카테고리를 찾을 수 없습니다');
    });

    it('should handle non-existent category', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          title: 'Test Todo',
          date: '2024-01-15T10:00:00.000Z',
          categoryId: 'non-existent-id'
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await testHelper.createTestTodo(userId, categoryId, {
        title: 'Test Todo'
      });
      todoId = todo.id;
    });

    it('should return todo with category information', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: `/todos/${todoId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const todo = response.json();
      expect(todo.id).toBe(todoId);
      expect(todo.title).toBe('Test Todo');
      expect(todo).toHaveProperty('category');
      expect(todo.category.name).toBe('Todo Test Category');
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: `/todos/${todoId}`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent todo', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/todos/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should deny access to other user\'s todo', async () => {
      const app = testHelper.getApp();
      
      // Create todo for another user
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);
      const otherTodo = await testHelper.createTestTodo(otherUser.id, otherCategory.id);

      const response = await app.inject({
        method: 'GET',
        url: `/todos/${otherTodo.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await testHelper.createTestTodo(userId, categoryId, {
        title: 'Original Todo',
        completed: false
      });
      todoId = todo.id;
    });

    it('should update todo', async () => {
      const app = testHelper.getApp();
      
      const updateData = {
        title: 'Updated Todo',
        completed: true,
        todoType: 'TASK'
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/todos/${todoId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: updateData
      });

      expect(response.statusCode).toBe(200);
      const todo = response.json();
      expect(todo.title).toBe('Updated Todo');
      expect(todo.completed).toBe(true);
      expect(todo.todoType).toBe('TASK');
    });

    it('should allow partial updates', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: `/todos/${todoId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          title: 'Only Title Updated'
        }
      });

      expect(response.statusCode).toBe(200);
      const todo = response.json();
      expect(todo.title).toBe('Only Title Updated');
      expect(todo.completed).toBe(false); // Should remain unchanged
    });

    it('should validate category ownership when updating category', async () => {
      const app = testHelper.getApp();
      
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);

      const response = await app.inject({
        method: 'PUT',
        url: `/todos/${todoId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          categoryId: otherCategory.id
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PUT',
        url: `/todos/${todoId}`,
        payload: { title: 'Updated' }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should deny access to other user\'s todo', async () => {
      const app = testHelper.getApp();
      
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);
      const otherTodo = await testHelper.createTestTodo(otherUser.id, otherCategory.id);

      const response = await app.inject({
        method: 'PUT',
        url: `/todos/${otherTodo.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: { title: 'Updated' }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('DELETE /todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await testHelper.createTestTodo(userId, categoryId);
      todoId = todo.id;
    });

    it('should delete todo', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'DELETE',
        url: `/todos/${todoId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().message).toContain('성공적으로 삭제');
      
      // Verify todo is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/todos/${todoId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });
      expect(getResponse.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'DELETE',
        url: `/todos/${todoId}`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should deny access to other user\'s todo', async () => {
      const app = testHelper.getApp();
      
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);
      const otherTodo = await testHelper.createTestTodo(otherUser.id, otherCategory.id);

      const response = await app.inject({
        method: 'DELETE',
        url: `/todos/${otherTodo.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('DELETE /todos', () => {
    beforeEach(async () => {
      // Create multiple todos
      await testHelper.createTestTodo(userId, categoryId, { title: 'Todo 1' });
      await testHelper.createTestTodo(userId, categoryId, { title: 'Todo 2' });
      await testHelper.createTestTodo(userId, categoryId, { title: 'Todo 3' });
    });

    it('should delete all user todos', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'DELETE',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().message).toContain('모든 Todo가 성공적으로 삭제');
      
      // Verify all todos are deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });
      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.json()).toHaveLength(0);
    });

    it('should only delete current user\'s todos', async () => {
      const app = testHelper.getApp();
      
      // Create todo for another user
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);
      await testHelper.createTestTodo(otherUser.id, otherCategory.id);

      const response = await app.inject({
        method: 'DELETE',
        url: '/todos',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      // Verify other user's todo still exists
      const prisma = testHelper.getPrisma();
      const remainingTodos = await prisma.todo.findMany({
        where: { userId: otherUser.id }
      });
      expect(remainingTodos).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'DELETE',
        url: '/todos'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /todos/:id/toggle', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await testHelper.createTestTodo(userId, categoryId, {
        completed: false
      });
      todoId = todo.id;
    });

    it('should toggle todo completion status', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PATCH',
        url: `/todos/${todoId}/toggle`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const todo = response.json();
      expect(todo.completed).toBe(true);
      
      // Toggle again
      const response2 = await app.inject({
        method: 'PATCH',
        url: `/todos/${todoId}/toggle`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response2.statusCode).toBe(200);
      const todo2 = response2.json();
      expect(todo2.completed).toBe(false);
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'PATCH',
        url: `/todos/${todoId}/toggle`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should deny access to other user\'s todo', async () => {
      const app = testHelper.getApp();
      
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);
      const otherTodo = await testHelper.createTestTodo(otherUser.id, otherCategory.id);

      const response = await app.inject({
        method: 'PATCH',
        url: `/todos/${otherTodo.id}/toggle`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /todos/stats', () => {
    beforeEach(async () => {
      // Create various todos for statistics
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Completed Event',
        todoType: TodoType.EVENT,
        completed: true
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Incomplete Event',
        todoType: TodoType.EVENT,
        completed: false
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Completed Task',
        todoType: TodoType.TASK,
        completed: true
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Incomplete Task 1',
        todoType: TodoType.TASK,
        completed: false
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Incomplete Task 2',
        todoType: TodoType.TASK,
        completed: false
      });
    });

    it('should return correct statistics', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/todos/stats',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const stats = response.json();
      
      expect(stats.total).toBe(5);
      expect(stats.completed).toBe(2);
      expect(stats.incomplete).toBe(3);
      
      expect(stats.byType.event.total).toBe(2);
      expect(stats.byType.event.completed).toBe(1);
      expect(stats.byType.event.incomplete).toBe(1);
      
      expect(stats.byType.task.total).toBe(3);
      expect(stats.byType.task.completed).toBe(1);
      expect(stats.byType.task.incomplete).toBe(2);
    });

    it('should return empty stats for new user', async () => {
      const app = testHelper.getApp();
      
      // Register new user
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'new-user@example.com',
          password: 'TestPassword123!',
          name: 'New User'
        }
      });
      
      const newUserLogin = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'new-user@example.com',
          password: 'TestPassword123!'
        }
      });
      
      const newUserToken = newUserLogin.json().accessToken;

      const response = await app.inject({
        method: 'GET',
        url: '/todos/stats',
        headers: {
          authorization: `Bearer ${newUserToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const stats = response.json();
      
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.incomplete).toBe(0);
      expect(stats.byType.event.total).toBe(0);
      expect(stats.byType.task.total).toBe(0);
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/todos/stats'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /todos/tasks-due', () => {
    beforeEach(async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Create tasks with different dates
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Old Incomplete Task',
        todoType: TodoType.TASK,
        completed: false,
        date: lastWeek
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Yesterday Incomplete Task',
        todoType: TodoType.TASK,
        completed: false,
        date: yesterday
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Yesterday Completed Task',
        todoType: TodoType.TASK,
        completed: true,
        date: yesterday
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Future Task',
        todoType: TodoType.TASK,
        completed: false,
        date: tomorrow
      });
      await testHelper.createTestTodo(userId, categoryId, {
        title: 'Old Event',
        todoType: TodoType.EVENT,
        completed: false,
        date: yesterday
      });
    });

    it('should return incomplete tasks before today', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/todos/tasks-due',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const tasks = response.json();
      
      expect(tasks).toHaveLength(2);
      const titles = tasks.map((t: { title: string }) => t.title);
      expect(titles).toContain('Old Incomplete Task');
      expect(titles).toContain('Yesterday Incomplete Task');
      expect(titles).not.toContain('Yesterday Completed Task'); // Completed
      expect(titles).not.toContain('Future Task'); // Future date
      expect(titles).not.toContain('Old Event'); // Not a task
    });

    it('should return empty array when no due tasks exist', async () => {
      const app = testHelper.getApp();
      
      // Register new user with no todos
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'new-user@example.com',
          password: 'TestPassword123!',
          name: 'New User'
        }
      });
      
      const newUserLogin = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'new-user@example.com',
          password: 'TestPassword123!'
        }
      });
      
      const newUserToken = newUserLogin.json().accessToken;

      const response = await app.inject({
        method: 'GET',
        url: '/todos/tasks-due',
        headers: {
          authorization: `Bearer ${newUserToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const tasks = response.json();
      expect(tasks).toHaveLength(0);
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'GET',
        url: '/todos/tasks-due'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /todos/move-tasks', () => {
    let taskIds: string[];

    beforeEach(async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const task1 = await testHelper.createTestTodo(userId, categoryId, {
        title: 'Task 1',
        todoType: TodoType.TASK,
        completed: false,
        date: yesterday
      });
      const task2 = await testHelper.createTestTodo(userId, categoryId, {
        title: 'Task 2',
        todoType: TodoType.TASK,
        completed: false,
        date: yesterday
      });

      taskIds = [task1.id, task2.id];
    });

    it('should move tasks to new date', async () => {
      const app = testHelper.getApp();
      const newDate = '2024-02-15T10:00:00.000Z';
      
      const response = await app.inject({
        method: 'POST',
        url: '/todos/move-tasks',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          taskIds: taskIds,
          newDate: newDate
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.success).toBe(true);
      expect(result.movedCount).toBe(2);
      
      // Verify tasks were moved
      const prisma = testHelper.getPrisma();
      const movedTasks = await prisma.todo.findMany({
        where: { id: { in: taskIds } }
      });
      
      movedTasks.forEach(task => {
        expect(task.date.toISOString()).toBe(newDate);
      });
    });

    it('should only move user\'s own tasks', async () => {
      const app = testHelper.getApp();
      
      // Create task for another user
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com'
      });
      const otherCategory = await testHelper.createTestCategory(otherUser.id);
      const otherTask = await testHelper.createTestTodo(otherUser.id, otherCategory.id, {
        todoType: TodoType.TASK
      });

      const response = await app.inject({
        method: 'POST',
        url: '/todos/move-tasks',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          taskIds: [...taskIds, otherTask.id],
          newDate: '2024-02-15T10:00:00.000Z'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.success).toBe(true);
      expect(result.movedCount).toBe(2); // Only user's own tasks
      
      // Verify other user's task wasn't moved
      const prisma = testHelper.getPrisma();
      const otherTaskAfter = await prisma.todo.findUnique({
        where: { id: otherTask.id }
      });
      expect(otherTaskAfter?.date).not.toBe(new Date('2024-02-15T10:00:00.000Z'));
    });

    it('should require authentication', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'POST',
        url: '/todos/move-tasks',
        payload: {
          taskIds: taskIds,
          newDate: '2024-02-15T10:00:00.000Z'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const app = testHelper.getApp();
      
      const response = await app.inject({
        method: 'POST',
        url: '/todos/move-tasks',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          // Missing required fields
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });
});