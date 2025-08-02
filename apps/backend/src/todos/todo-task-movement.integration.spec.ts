import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import * as request from "supertest";
import { JwtService } from "@nestjs/jwt";
import { TodoController } from "./todo.controller";
import { TodoService } from "./todo.service";
import { TodoRepository } from "./todo.repository";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { TodoEntity } from "./todo.entity";
import { User } from "../users/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { createMockCategory } from "../test-helpers/category.helper";
import { TodoCategory } from "@calendar-todo/shared-types";

interface TasksDueResponse {
  count: number;
  tasks: Array<{
    id: string;
    todoType: string;
    [key: string]: unknown;
  }>;
}

interface MoveTasksResponse {
  movedCount: number;
  movedTaskIds: string[];
}

describe("Todo Task Movement Integration", () => {
  let app: INestApplication;
  let _todoService: TodoService;
  let _todoRepository: TodoRepository;
  let _jwtService: JwtService;

  const _mockUser: User = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "hashed-password",
    profileImage: undefined,
    emailVerified: true,
    isActive: true,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
    generateId: jest.fn(),
    toProfile: jest.fn(),
  } as unknown as User;

  const mockCategory: TodoCategory = createMockCategory({
    id: "work",
    name: "업무",
    color: "#FF6B6B",
    createdAt: new Date("2023-01-01"),
  });

  const mockRepository = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findByUserIdAndDateRange: jest.fn(),
    findByUserIdAndCategory: jest.fn(),
    findByUserIdAndCompleted: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteByUserId: jest.fn(),
    toggle: jest.fn(),
    updateCategoryForUser: jest.fn(),
    getStatsForUser: jest.fn(),
  };

  const mockUserSettingsService = {
    getUserCategories: jest.fn().mockResolvedValue([mockCategory]),
    getCategoryById: jest.fn().mockResolvedValue(mockCategory),
    addCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        TodoService,
        {
          provide: TodoRepository,
          useValue: mockRepository,
        },
        {
          provide: UserSettingsService,
          useValue: mockUserSettingsService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest<Request>();
          request.user = _mockUser;
          return true;
        }),
      })
      .compile();

    app = module.createNestApplication();
    await app.init();

    _todoService = module.get<TodoService>(TodoService);
    _todoRepository = module.get<TodoRepository>(TodoRepository);
    _jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe("POST /todos/move-tasks", () => {
    it("should move overdue tasks to today", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Setup overdue tasks
      const overdueTasks = [
        new TodoEntity({
          id: "task-1",
          title: "Overdue Task 1",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          title: "Overdue Task 2",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
      ];

      // Setup mixed todos (some should not be moved)
      const allTodos = [
        ...overdueTasks,
        new TodoEntity({
          id: "event-1",
          title: "Past Event",
          todoType: "event",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-3",
          title: "Completed Task",
          todoType: "task",
          completed: true,
          dueDate: yesterday,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(allTodos);
      mockRepository.update.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post("/todos/move-tasks")
        .expect(200);

      expect(response.body).toEqual({
        message: "2개의 작업이 오늘로 이동되었습니다",
        movedCount: 2,
        movedTaskIds: ["task-1", "task-2"],
      });

      expect(mockRepository.update).toHaveBeenCalledTimes(2);
      expect(mockRepository.update).toHaveBeenCalledWith("task-1", {
        dueDate: today,
        updatedAt: expect.any(Date) as Date,
      });
      expect(mockRepository.update).toHaveBeenCalledWith("task-2", {
        dueDate: today,
        updatedAt: expect.any(Date) as Date,
      });
    });

    it("should return zero count when no tasks to move", async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // All tasks are either events, completed, or future
      const todos = [
        new TodoEntity({
          id: "event-1",
          todoType: "event",
          completed: false,
          dueDate: new Date(today.getTime() - 24 * 60 * 60 * 1000),
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-1",
          todoType: "task",
          completed: true,
          dueDate: new Date(today.getTime() - 24 * 60 * 60 * 1000),
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          todoType: "task",
          completed: false,
          dueDate: tomorrow,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(todos);

      const response = await request(app.getHttpServer())
        .post("/todos/move-tasks")
        .expect(200);

      expect(response.body).toEqual({
        message: "이동할 작업이 없습니다",
        movedCount: 0,
        movedTaskIds: [],
      });

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should handle partial failures gracefully", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const overdueTasks = [
        new TodoEntity({
          id: "task-1",
          title: "Task 1",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          title: "Task 2",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(overdueTasks);
      mockRepository.update
        .mockResolvedValueOnce(true) // First succeeds
        .mockRejectedValueOnce(new Error("Update failed")); // Second fails

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const response = await request(app.getHttpServer())
        .post("/todos/move-tasks")
        .expect(200);

      expect(response.body).toEqual({
        message: "1개의 작업이 오늘로 이동되었습니다",
        movedCount: 1,
        movedTaskIds: ["task-1"],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "작업 task-2 이동 실패:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("GET /todos/tasks-due", () => {
    it("should return tasks due for movement", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(yesterday);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

      const overdueTasks = [
        new TodoEntity({
          id: "task-1",
          title: "Overdue Task 1",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          categoryId: "work",
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          title: "Overdue Task 2",
          todoType: "task",
          completed: false,
          dueDate: twoDaysAgo,
          categoryId: "personal",
          userId: "user-1",
        }),
      ];

      const allTodos = [
        ...overdueTasks,
        new TodoEntity({
          id: "event-1",
          todoType: "event",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-3",
          todoType: "task",
          completed: true,
          dueDate: yesterday,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(allTodos);

      const response = await request(app.getHttpServer())
        .get("/todos/tasks-due")
        .expect(200);

      expect(response.body).toEqual({
        tasks: [
          {
            id: "task-1",
            title: "Overdue Task 1",
            date: yesterday.toISOString(),
            completed: false,
            todoType: "task",
            category: {
              id: "work",
              name: "Unknown",
              color: "#64748b",
              createdAt: expect.any(String) as string,
              order: 0,
            },
            userId: "user-1",
          },
          {
            id: "task-2",
            title: "Overdue Task 2",
            date: twoDaysAgo.toISOString(),
            completed: false,
            todoType: "task",
            category: {
              id: "personal",
              name: "Unknown",
              color: "#64748b",
              createdAt: expect.any(String) as string,
              order: 0,
            },
            userId: "user-1",
          },
        ],
        count: 2,
      });
    });

    it("should return empty result when no tasks due", async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get("/todos/tasks-due")
        .expect(200);

      expect(response.body).toEqual({
        tasks: [],
        count: 0,
      });
    });
  });

  describe("Complete Flow Integration", () => {
    it("should integrate task creation, querying due tasks, and moving them", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Step 1: Create some tasks (simulate existing overdue tasks)
      const overdueTasks = [
        new TodoEntity({
          id: "task-1",
          title: "Important Task",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          categoryId: "work",
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          title: "Personal Task",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          categoryId: "personal",
          userId: "user-1",
        }),
      ];

      const mixedTodos = [
        ...overdueTasks,
        new TodoEntity({
          id: "event-1",
          title: "Past Event",
          todoType: "event",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-3",
          title: "Future Task",
          todoType: "task",
          completed: false,
          dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(mixedTodos);
      mockRepository.update.mockResolvedValue(true);

      // Step 2: Check tasks due for movement
      const dueResponse = await request(app.getHttpServer())
        .get("/todos/tasks-due")
        .expect(200);

      const dueBody = dueResponse.body as TasksDueResponse;
      expect(dueBody.count).toBe(2);
      expect(dueBody.tasks).toHaveLength(2);
      expect(dueBody.tasks.map((t) => t.id)).toEqual(["task-1", "task-2"]);

      // Step 3: Move the tasks
      const moveResponse = await request(app.getHttpServer())
        .post("/todos/move-tasks")
        .expect(200);

      expect(moveResponse.body).toEqual({
        message: "2개의 작업이 오늘로 이동되었습니다",
        movedCount: 2,
        movedTaskIds: ["task-1", "task-2"],
      });

      // Verify that update was called correctly
      expect(mockRepository.update).toHaveBeenCalledTimes(2);
      expect(mockRepository.update).toHaveBeenCalledWith("task-1", {
        dueDate: today,
        updatedAt: expect.any(Date) as Date,
      });
      expect(mockRepository.update).toHaveBeenCalledWith("task-2", {
        dueDate: today,
        updatedAt: expect.any(Date) as Date,
      });
    });

    it("should handle edge case with no tasks at all", async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      // Check tasks due
      const dueResponse = await request(app.getHttpServer())
        .get("/todos/tasks-due")
        .expect(200);

      expect(dueResponse.body).toEqual({
        tasks: [],
        count: 0,
      });

      // Try to move tasks
      const moveResponse = await request(app.getHttpServer())
        .post("/todos/move-tasks")
        .expect(200);

      expect(moveResponse.body).toEqual({
        message: "이동할 작업이 없습니다",
        movedCount: 0,
        movedTaskIds: [],
      });

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should differentiate between events and tasks correctly", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Mix of events and tasks, all overdue
      const todos = [
        new TodoEntity({
          id: "event-1",
          title: "Past Event 1",
          todoType: "event",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-1",
          title: "Overdue Task 1",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "event-2",
          title: "Past Event 2",
          todoType: "event",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          title: "Overdue Task 2",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(todos);
      mockRepository.update.mockResolvedValue(true);

      // Check tasks due - should only return tasks, not events
      const dueResponse = await request(app.getHttpServer())
        .get("/todos/tasks-due")
        .expect(200);

      const dueBody2 = dueResponse.body as TasksDueResponse;
      expect(dueBody2.count).toBe(2);
      expect(dueBody2.tasks.map((t) => t.todoType)).toEqual(["task", "task"]);
      expect(dueBody2.tasks.map((t) => t.id)).toEqual(["task-1", "task-2"]);

      // Move tasks - should only move tasks, not events
      const moveResponse = await request(app.getHttpServer())
        .post("/todos/move-tasks")
        .expect(200);

      const moveBody = moveResponse.body as MoveTasksResponse;
      expect(moveBody.movedCount).toBe(2);
      expect(moveBody.movedTaskIds).toEqual(["task-1", "task-2"]);

      // Verify only tasks were updated
      expect(mockRepository.update).toHaveBeenCalledTimes(2);
      expect(mockRepository.update).toHaveBeenCalledWith(
        "task-1",
        expect.any(Object),
      );
      expect(mockRepository.update).toHaveBeenCalledWith(
        "task-2",
        expect.any(Object),
      );
      expect(mockRepository.update).not.toHaveBeenCalledWith(
        "event-1",
        expect.any(Object),
      );
      expect(mockRepository.update).not.toHaveBeenCalledWith(
        "event-2",
        expect.any(Object),
      );
    });
  });
});
