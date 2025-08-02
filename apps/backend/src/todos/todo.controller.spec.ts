import { Test, TestingModule } from "@nestjs/testing";
import { TodoController } from "./todo.controller";
import { TodoService } from "./todo.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";
import { TodoItem, TodoCategory, TodoStats } from "@calendar-todo/shared-types";
import { User } from "../users/user.entity";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { createMockCategory } from "../test-helpers/category.helper";

describe("TodoController", () => {
  let controller: TodoController;

  const mockUser = {
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

  const mockTodo: TodoItem = {
    id: "todo-1",
    title: "테스트 할일",
    completed: false,
    category: mockCategory,
    todoType: "event",
    date: new Date("2024-01-15"),
  };

  const mockStats: TodoStats = {
    total: 10,
    completed: 3,
    incomplete: 7,
    completionRate: 30,
    recentCompletions: 2,
    byType: {
      event: { total: 6, completed: 2, incomplete: 4 },
      task: { total: 4, completed: 1, incomplete: 3 },
    },
  };

  const mockTodoService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
    getStats: jest.fn(),
    removeAllByUserId: jest.fn(),
    moveTasksToNextDay: jest.fn(),
    getTasksDueForMove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        {
          provide: TodoService,
          useValue: mockTodoService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TodoController>(TodoController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("새 할일을 성공적으로 생성해야 함", async () => {
      const createTodoDto: CreateTodoDto = {
        title: "새 할일",
        description: "설명",
        priority: "high",
        category: {
          ...mockCategory,
          createdAt: mockCategory.createdAt.toISOString(),
        },
        date: "2024-01-15T09:00:00.000Z",
      };

      mockTodoService.create.mockResolvedValue(mockTodo);

      const result = await controller.create(createTodoDto, mockUser);

      expect(mockTodoService.create).toHaveBeenCalledWith(
        createTodoDto,
        mockUser.id,
      );
      expect(result).toEqual({ todo: mockTodo });
    });

    it("서비스에서 에러가 발생하면 에러를 전파해야 함", async () => {
      const createTodoDto: CreateTodoDto = {
        title: "새 할일",
        category: {
          ...mockCategory,
          createdAt: mockCategory.createdAt.toISOString(),
        },
        date: "2024-01-15T09:00:00.000Z",
      };

      mockTodoService.create.mockRejectedValue(new Error("생성 실패"));

      await expect(controller.create(createTodoDto, mockUser)).rejects.toThrow(
        "생성 실패",
      );
    });
  });

  describe("findAll", () => {
    it("모든 할일을 성공적으로 조회해야 함", async () => {
      const todos = [mockTodo];
      mockTodoService.findAll.mockResolvedValue(todos);
      mockTodoService.getStats.mockResolvedValue(mockStats);

      const result = await controller.findAll(mockUser);

      expect(mockTodoService.findAll).toHaveBeenCalledWith(
        mockUser.id,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(mockTodoService.getStats).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ todos, stats: mockStats });
    });

    it("필터 조건으로 할일을 조회해야 함", async () => {
      const todos = [mockTodo];
      const startDate = "2024-01-01T00:00:00.000Z";
      const endDate = "2024-01-31T23:59:59.999Z";
      const categoryId = "work";
      const completed = true;

      mockTodoService.findAll.mockResolvedValue(todos);
      mockTodoService.getStats.mockResolvedValue(mockStats);

      const result = await controller.findAll(
        mockUser,
        startDate,
        endDate,
        categoryId,
        completed,
      );

      expect(mockTodoService.findAll).toHaveBeenCalledWith(
        mockUser.id,
        startDate,
        endDate,
        categoryId,
        completed,
      );
      expect(result).toEqual({ todos, stats: mockStats });
    });
  });

  describe("getStats", () => {
    it("할일 통계를 성공적으로 조회해야 함", async () => {
      mockTodoService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockUser);

      expect(mockTodoService.getStats).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ stats: mockStats });
    });
  });

  describe("findOne", () => {
    it("특정 할일을 성공적으로 조회해야 함", async () => {
      mockTodoService.findOne.mockResolvedValue(mockTodo);

      const result = await controller.findOne("todo-1", mockUser);

      expect(mockTodoService.findOne).toHaveBeenCalledWith(
        "todo-1",
        mockUser.id,
      );
      expect(result).toEqual({ todo: mockTodo });
    });

    it("존재하지 않는 할일 조회 시 NotFoundException을 던져야 함", async () => {
      mockTodoService.findOne.mockRejectedValue(
        new NotFoundException("할일을 찾을 수 없습니다"),
      );

      await expect(controller.findOne("nonexistent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("권한이 없는 할일 조회 시 ForbiddenException을 던져야 함", async () => {
      mockTodoService.findOne.mockRejectedValue(
        new ForbiddenException("해당 할일에 접근할 권한이 없습니다"),
      );

      await expect(controller.findOne("todo-1", mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("update", () => {
    it("할일을 성공적으로 수정해야 함", async () => {
      const updateTodoDto: UpdateTodoDto = {
        title: "수정된 할일",
        completed: true,
      };

      const updatedTodo = { ...mockTodo, ...updateTodoDto };
      mockTodoService.update.mockResolvedValue(updatedTodo);

      const result = await controller.update("todo-1", updateTodoDto, mockUser);

      expect(mockTodoService.update).toHaveBeenCalledWith(
        "todo-1",
        updateTodoDto,
        mockUser.id,
      );
      expect(result).toEqual({ todo: updatedTodo });
    });

    it("존재하지 않는 할일 수정 시 NotFoundException을 던져야 함", async () => {
      const updateTodoDto: UpdateTodoDto = { title: "수정된 할일" };
      mockTodoService.update.mockRejectedValue(
        new NotFoundException("할일을 찾을 수 없습니다"),
      );

      await expect(
        controller.update("nonexistent", updateTodoDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("toggle", () => {
    it("할일 완료 상태를 성공적으로 토글해야 함", async () => {
      const toggledTodo = { ...mockTodo, completed: !mockTodo.completed };
      mockTodoService.toggle.mockResolvedValue(toggledTodo);

      const result = await controller.toggle("todo-1", mockUser);

      expect(mockTodoService.toggle).toHaveBeenCalledWith(
        "todo-1",
        mockUser.id,
      );
      expect(result).toEqual({ todo: toggledTodo });
    });

    it("존재하지 않는 할일 토글 시 NotFoundException을 던져야 함", async () => {
      mockTodoService.toggle.mockRejectedValue(
        new NotFoundException("할일을 찾을 수 없습니다"),
      );

      await expect(controller.toggle("nonexistent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("할일을 성공적으로 삭제해야 함", async () => {
      const deleteResult = { success: true, deletedId: "todo-1" };
      mockTodoService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove("todo-1", mockUser);

      expect(mockTodoService.remove).toHaveBeenCalledWith(
        "todo-1",
        mockUser.id,
      );
      expect(result).toEqual(deleteResult);
    });

    it("존재하지 않는 할일 삭제 시 NotFoundException을 던져야 함", async () => {
      mockTodoService.remove.mockRejectedValue(
        new NotFoundException("할일을 찾을 수 없습니다"),
      );

      await expect(controller.remove("nonexistent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("removeAll", () => {
    it("모든 할일을 성공적으로 삭제해야 함", async () => {
      const deletedCount = 5;
      mockTodoService.removeAllByUserId.mockResolvedValue(deletedCount);

      const result = await controller.removeAll(mockUser);

      expect(mockTodoService.removeAllByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual({
        deletedCount,
        message: "모든 할일이 삭제되었습니다",
      });
    });

    it("삭제할 할일이 없을 때 0을 반환해야 함", async () => {
      mockTodoService.removeAllByUserId.mockResolvedValue(0);

      const result = await controller.removeAll(mockUser);

      expect(result).toEqual({
        deletedCount: 0,
        message: "모든 할일이 삭제되었습니다",
      });
    });
  });

  describe("moveTasks", () => {
    it("should successfully move tasks to today", async () => {
      const moveResult = {
        movedCount: 3,
        movedTaskIds: ["task-1", "task-2", "task-3"],
      };

      mockTodoService.moveTasksToNextDay.mockResolvedValue(moveResult);

      const result = await controller.moveTasks(mockUser);

      expect(mockTodoService.moveTasksToNextDay).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual({
        message: "3개의 작업이 오늘로 이동되었습니다",
        movedCount: 3,
        movedTaskIds: ["task-1", "task-2", "task-3"],
      });
    });

    it("should return appropriate message when no tasks to move", async () => {
      const moveResult = {
        movedCount: 0,
        movedTaskIds: [],
      };

      mockTodoService.moveTasksToNextDay.mockResolvedValue(moveResult);

      const result = await controller.moveTasks(mockUser);

      expect(mockTodoService.moveTasksToNextDay).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual({
        message: "이동할 작업이 없습니다",
        movedCount: 0,
        movedTaskIds: [],
      });
    });

    it("should handle single task move", async () => {
      const moveResult = {
        movedCount: 1,
        movedTaskIds: ["task-1"],
      };

      mockTodoService.moveTasksToNextDay.mockResolvedValue(moveResult);

      const result = await controller.moveTasks(mockUser);

      expect(result).toEqual({
        message: "1개의 작업이 오늘로 이동되었습니다",
        movedCount: 1,
        movedTaskIds: ["task-1"],
      });
    });

    it("should propagate service errors", async () => {
      mockTodoService.moveTasksToNextDay.mockRejectedValue(
        new Error("Move failed"),
      );

      await expect(controller.moveTasks(mockUser)).rejects.toThrow(
        "Move failed",
      );
    });
  });

  describe("getTasksDue", () => {
    it("should return tasks due for move", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const taskEntities = [
        {
          id: "task-1",
          title: "Overdue Task 1",
          dueDate: yesterday,
          completed: false,
          todoType: "task",
          categoryId: "work",
          userId: "user-1",
        },
        {
          id: "task-2",
          title: "Overdue Task 2",
          dueDate: yesterday,
          completed: false,
          todoType: "task",
          categoryId: "personal",
          userId: "user-1",
        },
      ];

      mockTodoService.getTasksDueForMove.mockResolvedValue(taskEntities);

      const result = await controller.getTasksDue(mockUser);

      expect(mockTodoService.getTasksDueForMove).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual({
        tasks: [
          {
            id: "task-1",
            title: "Overdue Task 1",
            date: yesterday,
            completed: false,
            todoType: "task",
            category: {
              id: "work",
              name: "Unknown",
              color: "#64748b",
              createdAt: expect.any(Date),
              order: 0,
            },
            userId: "user-1",
          },
          {
            id: "task-2",
            title: "Overdue Task 2",
            date: yesterday,
            completed: false,
            todoType: "task",
            category: {
              id: "personal",
              name: "Unknown",
              color: "#64748b",
              createdAt: expect.any(Date),
              order: 0,
            },
            userId: "user-1",
          },
        ],
        count: 2,
      });
    });

    it("should return empty array when no tasks due", async () => {
      mockTodoService.getTasksDueForMove.mockResolvedValue([]);

      const result = await controller.getTasksDue(mockUser);

      expect(mockTodoService.getTasksDueForMove).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual({
        tasks: [],
        count: 0,
      });
    });

    it("should handle single task due", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const taskEntities = [
        {
          id: "task-1",
          title: "Single Overdue Task",
          dueDate: yesterday,
          completed: false,
          todoType: "task",
          categoryId: "work",
          userId: "user-1",
        },
      ];

      mockTodoService.getTasksDueForMove.mockResolvedValue(taskEntities);

      const result = await controller.getTasksDue(mockUser);

      expect(result.count).toBe(1);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe("task-1");
    });

    it("should propagate service errors", async () => {
      mockTodoService.getTasksDueForMove.mockRejectedValue(
        new Error("Query failed"),
      );

      await expect(controller.getTasksDue(mockUser)).rejects.toThrow(
        "Query failed",
      );
    });
  });

  describe("create with todoType", () => {
    it("should create todo with specified todoType", async () => {
      const createTodoDto: CreateTodoDto = {
        title: "Task Todo",
        category: {
          ...mockCategory,
          createdAt: mockCategory.createdAt.toISOString(),
        },
        date: "2024-01-15T09:00:00.000Z",
        todoType: "task",
      };

      const taskTodo = { ...mockTodo, todoType: "task" as const };
      mockTodoService.create.mockResolvedValue(taskTodo);

      const result = await controller.create(createTodoDto, mockUser);

      expect(mockTodoService.create).toHaveBeenCalledWith(
        createTodoDto,
        mockUser.id,
      );
      expect(result).toEqual({ todo: taskTodo });
    });

    it("should create todo with default todoType when not specified", async () => {
      const createTodoDto: CreateTodoDto = {
        title: "Event Todo",
        category: {
          ...mockCategory,
          createdAt: mockCategory.createdAt.toISOString(),
        },
        date: "2024-01-15T09:00:00.000Z",
        // todoType not specified
      };

      mockTodoService.create.mockResolvedValue(mockTodo);

      const result = await controller.create(createTodoDto, mockUser);

      expect(mockTodoService.create).toHaveBeenCalledWith(
        createTodoDto,
        mockUser.id,
      );
      expect(result).toEqual({ todo: mockTodo });
    });
  });

  describe("update with todoType", () => {
    it("should update todo with todoType", async () => {
      const updateTodoDto: UpdateTodoDto = {
        title: "Updated Task",
        todoType: "task",
      };

      const updatedTodo = { ...mockTodo, title: "Updated Task", todoType: "task" as const };
      mockTodoService.update.mockResolvedValue(updatedTodo);

      const result = await controller.update("todo-1", updateTodoDto, mockUser);

      expect(mockTodoService.update).toHaveBeenCalledWith(
        "todo-1",
        updateTodoDto,
        mockUser.id,
      );
      expect(result).toEqual({ todo: updatedTodo });
    });

    it("should update other fields without affecting todoType", async () => {
      const updateTodoDto: UpdateTodoDto = {
        title: "Updated Title Only",
        completed: true,
      };

      const updatedTodo = { ...mockTodo, title: "Updated Title Only", completed: true };
      mockTodoService.update.mockResolvedValue(updatedTodo);

      const result = await controller.update("todo-1", updateTodoDto, mockUser);

      expect(result.todo.todoType).toBe("event"); // Should remain unchanged
    });
  });
});
