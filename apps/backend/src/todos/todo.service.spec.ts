import { Test, TestingModule } from "@nestjs/testing";
import { TodoService } from "./todo.service";
import { TodoRepository } from "./todo.repository";
import { TodoEntity } from "./todo.entity";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";
import { TodoItem, TodoCategory } from "@calendar-todo/shared-types";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { subDays } from "date-fns";
import { createMockCategory } from "../test-helpers/category.helper";

describe("TodoService", () => {
  let service: TodoService;

  const mockCategory: TodoCategory = createMockCategory({
    id: "work",
    name: "업무",
    color: "#FF6B6B",
    createdAt: new Date("2023-01-01"),
  });

  const mockTodoEntity: TodoEntity = new TodoEntity({
    id: "todo-1",
    title: "테스트 할일",
    description: "테스트 설명",
    completed: false,
    priority: "high",
    categoryId: mockCategory.id,
    dueDate: new Date("2024-01-15"),
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
    userId: "user-1",
  });

  const mockTodoItem: TodoItem = {
    id: "todo-1",
    title: "테스트 할일",
    completed: false,
    category: mockCategory,
    todoType: "event",
    date: new Date("2024-01-15"),
    userId: "user-1",
  };

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
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
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

      mockRepository.create.mockResolvedValue(mockTodoEntity);

      const result = await service.create(createTodoDto, "user-1");

      expect(mockRepository.create).toHaveBeenCalledWith({
        title: createTodoDto.title,
        description: createTodoDto.description,
        priority: createTodoDto.priority,
        categoryId: createTodoDto.category.id,
        todoType: "event", // Default value
        dueDate: new Date(createTodoDto.date),
        userId: "user-1",
      });
      expect(result).toEqual(mockTodoItem);
    });

    it("priority가 없으면 기본값으로 medium을 설정해야 함", async () => {
      const createTodoDto: CreateTodoDto = {
        title: "새 할일",
        category: {
          ...mockCategory,
          createdAt: mockCategory.createdAt.toISOString(),
        },
        date: "2024-01-15T09:00:00.000Z",
      };

      mockRepository.create.mockResolvedValue(mockTodoEntity);

      await service.create(createTodoDto, "user-1");

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: "medium",
        }),
      );
    });
  });

  describe("findAll", () => {
    it("날짜 범위로 할일을 조회해야 함", async () => {
      const startDate = "2024-01-01T00:00:00.000Z";
      const endDate = "2024-01-31T23:59:59.999Z";

      mockRepository.findByUserIdAndDateRange.mockResolvedValue([
        mockTodoEntity,
      ]);

      const result = await service.findAll("user-1", startDate, endDate);

      expect(mockRepository.findByUserIdAndDateRange).toHaveBeenCalledWith(
        "user-1",
        new Date(startDate),
        new Date(endDate),
      );
      expect(result).toEqual([mockTodoItem]);
    });

    it("카테고리로 할일을 조회해야 함", async () => {
      mockRepository.findByUserIdAndCategory.mockResolvedValue([
        mockTodoEntity,
      ]);

      const result = await service.findAll(
        "user-1",
        undefined,
        undefined,
        "work",
      );

      expect(mockRepository.findByUserIdAndCategory).toHaveBeenCalledWith(
        "user-1",
        "work",
      );
      expect(result).toEqual([mockTodoItem]);
    });

    it("완료 상태로 할일을 조회해야 함", async () => {
      mockRepository.findByUserIdAndCompleted.mockResolvedValue([
        mockTodoEntity,
      ]);

      const result = await service.findAll(
        "user-1",
        undefined,
        undefined,
        undefined,
        true,
      );

      expect(mockRepository.findByUserIdAndCompleted).toHaveBeenCalledWith(
        "user-1",
        true,
      );
      expect(result).toEqual([mockTodoItem]);
    });

    it("조건이 없으면 사용자의 모든 할일을 조회해야 함", async () => {
      mockRepository.findByUserId.mockResolvedValue([mockTodoEntity]);

      const result = await service.findAll("user-1");

      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-1");
      expect(result).toEqual([mockTodoItem]);
    });
  });

  describe("findOne", () => {
    it("특정 할일을 성공적으로 조회해야 함", async () => {
      mockRepository.findById.mockResolvedValue(mockTodoEntity);

      const result = await service.findOne("todo-1", "user-1");

      expect(mockRepository.findById).toHaveBeenCalledWith("todo-1");
      expect(result).toEqual(mockTodoItem);
    });

    it("존재하지 않는 할일 조회 시 NotFoundException을 던져야 함", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne("nonexistent", "user-1")).rejects.toThrow(
        new NotFoundException("할일을 찾을 수 없습니다"),
      );
    });

    it("다른 사용자의 할일 조회 시 ForbiddenException을 던져야 함", async () => {
      const otherUserTodo = new TodoEntity({
        ...mockTodoEntity,
        userId: "other-user",
      });
      mockRepository.findById.mockResolvedValue(otherUserTodo);

      await expect(service.findOne("todo-1", "user-1")).rejects.toThrow(
        new ForbiddenException("해당 할일에 접근할 권한이 없습니다"),
      );
    });
  });

  describe("update", () => {
    it("할일을 성공적으로 수정해야 함", async () => {
      const updateTodoDto: UpdateTodoDto = {
        title: "수정된 할일",
        completed: true,
      };

      const updatedEntity = new TodoEntity({
        ...mockTodoEntity,
        title: updateTodoDto.title,
        completed: updateTodoDto.completed,
      });

      mockRepository.findById.mockResolvedValue(mockTodoEntity);
      mockRepository.update.mockResolvedValue(updatedEntity);

      const result = await service.update("todo-1", updateTodoDto, "user-1");

      expect(mockRepository.findById).toHaveBeenCalledWith("todo-1");
      expect(mockRepository.update).toHaveBeenCalledWith("todo-1", {
        title: updateTodoDto.title,
        completed: updateTodoDto.completed,
      });
      expect(result.title).toBe("수정된 할일");
      expect(result.completed).toBe(true);
    });

    it("존재하지 않는 할일 수정 시 NotFoundException을 던져야 함", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update("nonexistent", {}, "user-1")).rejects.toThrow(
        new NotFoundException("할일을 찾을 수 없습니다"),
      );
    });

    it("다른 사용자의 할일 수정 시 ForbiddenException을 던져야 함", async () => {
      const otherUserTodo = new TodoEntity({
        ...mockTodoEntity,
        userId: "other-user",
      });
      mockRepository.findById.mockResolvedValue(otherUserTodo);

      await expect(service.update("todo-1", {}, "user-1")).rejects.toThrow(
        new ForbiddenException("해당 할일을 수정할 권한이 없습니다"),
      );
    });

    it("date가 문자열로 제공되면 Date 객체로 변환해야 함", async () => {
      const updateTodoDto: UpdateTodoDto = {
        date: "2024-02-15T10:00:00.000Z",
      };

      mockRepository.findById.mockResolvedValue(mockTodoEntity);
      mockRepository.update.mockResolvedValue(mockTodoEntity);

      await service.update("todo-1", updateTodoDto, "user-1");

      expect(mockRepository.update).toHaveBeenCalledWith("todo-1", {
        dueDate: new Date("2024-02-15T10:00:00.000Z"),
      });
    });
  });

  describe("remove", () => {
    it("할일을 성공적으로 삭제해야 함", async () => {
      mockRepository.findById.mockResolvedValue(mockTodoEntity);
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.remove("todo-1", "user-1");

      expect(mockRepository.findById).toHaveBeenCalledWith("todo-1");
      expect(mockRepository.delete).toHaveBeenCalledWith("todo-1");
      expect(result).toEqual({ success: true, deletedId: "todo-1" });
    });

    it("존재하지 않는 할일 삭제 시 NotFoundException을 던져야 함", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove("nonexistent", "user-1")).rejects.toThrow(
        new NotFoundException("할일을 찾을 수 없습니다"),
      );
    });

    it("다른 사용자의 할일 삭제 시 ForbiddenException을 던져야 함", async () => {
      const otherUserTodo = new TodoEntity({
        ...mockTodoEntity,
        userId: "other-user",
      });
      mockRepository.findById.mockResolvedValue(otherUserTodo);

      await expect(service.remove("todo-1", "user-1")).rejects.toThrow(
        new ForbiddenException("해당 할일을 삭제할 권한이 없습니다"),
      );
    });
  });

  describe("toggle", () => {
    it("할일 완료 상태를 성공적으로 토글해야 함", async () => {
      const toggledEntity = new TodoEntity({
        ...mockTodoEntity,
        completed: !mockTodoEntity.completed,
      });

      mockRepository.findById.mockResolvedValue(mockTodoEntity);
      mockRepository.toggle.mockResolvedValue(toggledEntity);

      const result = await service.toggle("todo-1", "user-1");

      expect(mockRepository.findById).toHaveBeenCalledWith("todo-1");
      expect(mockRepository.toggle).toHaveBeenCalledWith("todo-1");
      expect(result.completed).toBe(!mockTodoEntity.completed);
    });

    it("존재하지 않는 할일 토글 시 NotFoundException을 던져야 함", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.toggle("nonexistent", "user-1")).rejects.toThrow(
        new NotFoundException("할일을 찾을 수 없습니다"),
      );
    });

    it("다른 사용자의 할일 토글 시 ForbiddenException을 던져야 함", async () => {
      const otherUserTodo = new TodoEntity({
        ...mockTodoEntity,
        userId: "other-user",
      });
      mockRepository.findById.mockResolvedValue(otherUserTodo);

      await expect(service.toggle("todo-1", "user-1")).rejects.toThrow(
        new ForbiddenException("해당 할일을 수정할 권한이 없습니다"),
      );
    });
  });

  describe("getStats", () => {
    it("할일 통계를 올바르게 계산해야 함", async () => {
      const completedTodo = new TodoEntity({
        ...mockTodoEntity,
        id: "todo-2",
        completed: true,
        updatedAt: new Date(), // 최근 완료
      });

      const oldCompletedTodo = new TodoEntity({
        ...mockTodoEntity,
        id: "todo-3",
        completed: true,
        updatedAt: subDays(new Date(), 10), // 오래된 완료
      });

      const completedTodos = [completedTodo, oldCompletedTodo];

      // Mock getStatsForUser to return basic stats
      mockRepository.getStatsForUser.mockResolvedValue({
        total: 4,
        completed: 2,
        incomplete: 2,
        byPriority: { high: 1, medium: 2, low: 1 },
      });

      // Mock findByUserIdAndCompleted to return completed todos
      mockRepository.findByUserIdAndCompleted.mockResolvedValue(completedTodos);

      // Mock findByUserId to return all todos for type calculation
      mockRepository.findByUserId.mockResolvedValue([
        mockTodoEntity, // event
        completedTodo, // event
        oldCompletedTodo, // event
        new TodoEntity({ ...mockTodoEntity, id: "todo-4", todoType: "task" }), // task
      ]);

      const result = await service.getStats("user-1");

      expect(mockRepository.getStatsForUser).toHaveBeenCalledWith("user-1");
      expect(mockRepository.findByUserIdAndCompleted).toHaveBeenCalledWith(
        "user-1",
        true,
      );
      expect(result).toEqual({
        total: 4,
        completed: 2,
        incomplete: 2,
        completionRate: 50,
        recentCompletions: 1,
        byType: {
          event: {
            total: 3,
            completed: 2,
            incomplete: 1,
          },
          task: {
            total: 1,
            completed: 0,
            incomplete: 1,
          },
        },
      });
    });

    it("할일이 없을 때 기본 통계를 반환해야 함", async () => {
      // Mock getStatsForUser to return empty stats
      mockRepository.getStatsForUser.mockResolvedValue({
        total: 0,
        completed: 0,
        incomplete: 0,
        byPriority: { high: 0, medium: 0, low: 0 },
      });

      // Mock findByUserIdAndCompleted to return empty array
      mockRepository.findByUserIdAndCompleted.mockResolvedValue([]);

      // Mock findByUserId to return empty array
      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getStats("user-1");

      expect(result).toEqual({
        total: 0,
        completed: 0,
        incomplete: 0,
        completionRate: 0,
        recentCompletions: 0,
        byType: {
          event: {
            total: 0,
            completed: 0,
            incomplete: 0,
          },
          task: {
            total: 0,
            completed: 0,
            incomplete: 0,
          },
        },
      });
    });
  });

  describe("removeAllByUserId", () => {
    it("사용자의 모든 할일을 삭제해야 함", async () => {
      const mockTodos = [
        { id: "1" },
        { id: "2" },
        { id: "3" },
        { id: "4" },
        { id: "5" },
      ];
      mockRepository.findByUserId.mockResolvedValue(mockTodos);
      mockRepository.deleteByUserId.mockResolvedValue(true);

      const result = await service.removeAllByUserId("user-1");

      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-1");
      expect(mockRepository.deleteByUserId).toHaveBeenCalledWith("user-1");
      expect(result).toBe(5);
    });
  });

  describe("updateCategoryForUser", () => {
    it("사용자의 카테고리를 업데이트해야 함", async () => {
      const oldCategory: TodoCategory = createMockCategory({
        id: "old-category",
        name: "이전 카테고리",
        color: "#000000",
      });

      const newCategory: TodoCategory = createMockCategory({
        id: "new-category",
        name: "새 카테고리",
        color: "#ffffff",
      });

      mockRepository.updateCategoryForUser.mockResolvedValue(3);

      const result = await service.updateCategoryForUser(
        "user-1",
        oldCategory.id,
        newCategory.id,
      );

      expect(mockRepository.updateCategoryForUser).toHaveBeenCalledWith(
        "user-1",
        oldCategory.id,
        newCategory.id,
      );
      expect(result).toBe(3);
    });
  });

  describe("bulkCreate", () => {
    it("여러 할일을 한 번에 생성해야 함", async () => {
      const todos: Omit<TodoItem, "id">[] = [
        {
          title: "할일 1",
          completed: false,
          category: mockCategory,
          todoType: "event",
          date: new Date("2024-01-15"),
        },
        {
          title: "할일 2",
          completed: true,
          category: mockCategory,
          todoType: "task",
          date: new Date("2024-01-16"),
        },
      ];

      // Mock the create method to return different todos
      mockRepository.create
        .mockResolvedValueOnce(
          new TodoEntity({ ...mockTodoEntity, title: "할일 1", id: "todo-1" }),
        )
        .mockResolvedValueOnce(
          new TodoEntity({ ...mockTodoEntity, title: "할일 2", id: "todo-2" }),
        );

      // Mock the update method for completed todos
      mockRepository.findById.mockResolvedValue(mockTodoEntity);
      mockRepository.update.mockResolvedValue(mockTodoEntity);

      const result = await service.bulkCreate(todos, "user-1");

      expect(mockRepository.create).toHaveBeenCalledTimes(2);
      expect(mockRepository.update).toHaveBeenCalledTimes(1); // Only for the completed todo
      expect(result).toHaveLength(2);
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

      mockRepository.create.mockResolvedValue(
        new TodoEntity({ ...mockTodoEntity, todoType: "task" }),
      );

      await service.create(createTodoDto, "user-1");

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          todoType: "task",
        }),
      );
    });

    it("should use default todoType 'event' when not specified", async () => {
      const createTodoDto: CreateTodoDto = {
        title: "Default Todo",
        category: {
          ...mockCategory,
          createdAt: mockCategory.createdAt.toISOString(),
        },
        date: "2024-01-15T09:00:00.000Z",
      };

      mockRepository.create.mockResolvedValue(mockTodoEntity);

      await service.create(createTodoDto, "user-1");

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          todoType: "event",
        }),
      );
    });
  });

  describe("update with todoType", () => {
    it("should update todoType when provided", async () => {
      const updateTodoDto: UpdateTodoDto = {
        todoType: "task",
      };

      mockRepository.findById.mockResolvedValue(mockTodoEntity);
      mockRepository.update.mockResolvedValue(
        new TodoEntity({ ...mockTodoEntity, todoType: "task" }),
      );

      await service.update("todo-1", updateTodoDto, "user-1");

      expect(mockRepository.update).toHaveBeenCalledWith("todo-1", {
        todoType: "task",
      });
    });

    it("should not include todoType in update if not provided", async () => {
      const updateTodoDto: UpdateTodoDto = {
        title: "Updated Title",
      };

      mockRepository.findById.mockResolvedValue(mockTodoEntity);
      mockRepository.update.mockResolvedValue(mockTodoEntity);

      await service.update("todo-1", updateTodoDto, "user-1");

      expect(mockRepository.update).toHaveBeenCalledWith("todo-1", {
        title: "Updated Title",
      });
      // Verify that the update call did not include todoType
      const updateCalls = mockRepository.update.mock.calls as [
        string,
        UpdateTodoDto,
      ][];
      const updateCallArgs = updateCalls[0][1];
      expect(updateCallArgs).not.toHaveProperty("todoType");
    });
  });

  describe("getTasksDueForMove", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    it("should return only incomplete tasks from past dates", async () => {
      const todos = [
        // Should be included - incomplete task from yesterday
        new TodoEntity({
          id: "task-1",
          title: "Incomplete Task",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        // Should NOT be included - completed task
        new TodoEntity({
          id: "task-2",
          title: "Completed Task",
          todoType: "task",
          completed: true,
          dueDate: yesterday,
          userId: "user-1",
        }),
        // Should NOT be included - event type
        new TodoEntity({
          id: "event-1",
          title: "Past Event",
          todoType: "event",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        // Should NOT be included - future date
        new TodoEntity({
          id: "task-3",
          title: "Future Task",
          todoType: "task",
          completed: false,
          dueDate: tomorrow,
          userId: "user-1",
        }),
        // Should NOT be included - today's task
        new TodoEntity({
          id: "task-4",
          title: "Today's Task",
          todoType: "task",
          completed: false,
          dueDate: today,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(todos);

      const result = await service.getTasksDueForMove("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("task-1");
      expect(result[0].todoType).toBe("task");
      expect(result[0].completed).toBe(false);
    });

    it("should return empty array when no tasks need moving", async () => {
      const todos = [
        // All events
        new TodoEntity({
          id: "event-1",
          todoType: "event",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        // All completed
        new TodoEntity({
          id: "task-1",
          todoType: "task",
          completed: true,
          dueDate: yesterday,
          userId: "user-1",
        }),
        // All future or today
        new TodoEntity({
          id: "task-2",
          todoType: "task",
          completed: false,
          dueDate: tomorrow,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(todos);

      const result = await service.getTasksDueForMove("user-1");

      expect(result).toHaveLength(0);
    });

    it("should handle multiple tasks from different past dates", async () => {
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const todos = [
        new TodoEntity({
          id: "task-1",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          todoType: "task",
          completed: false,
          dueDate: twoDaysAgo,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-3",
          todoType: "task",
          completed: false,
          dueDate: oneWeekAgo,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(todos);

      const result = await service.getTasksDueForMove("user-1");

      expect(result).toHaveLength(3);
      expect(result.map((t) => t.id)).toEqual(["task-1", "task-2", "task-3"]);
    });
  });

  describe("moveTasksToNextDay", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    it("should move all eligible tasks to today", async () => {
      const tasksToMove = [
        new TodoEntity({
          id: "task-1",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(tasksToMove);
      mockRepository.update.mockResolvedValue(true);

      const result = await service.moveTasksToNextDay("user-1");

      expect(result.movedCount).toBe(2);
      expect(result.movedTaskIds).toEqual(["task-1", "task-2"]);
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
      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await service.moveTasksToNextDay("user-1");

      expect(result.movedCount).toBe(0);
      expect(result.movedTaskIds).toEqual([]);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should handle update failures gracefully", async () => {
      const tasksToMove = [
        new TodoEntity({
          id: "task-1",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(tasksToMove);
      mockRepository.update
        .mockResolvedValueOnce(true) // First task succeeds
        .mockRejectedValueOnce(new Error("Update failed")); // Second task fails

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await service.moveTasksToNextDay("user-1");

      expect(result.movedCount).toBe(1);
      expect(result.movedTaskIds).toEqual(["task-1"]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "작업 task-2 이동 실패:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should not move events even if they are incomplete and past due", async () => {
      const mixedTodos = [
        new TodoEntity({
          id: "event-1",
          todoType: "event",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-1",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(mixedTodos);
      mockRepository.update.mockResolvedValue(true);

      const result = await service.moveTasksToNextDay("user-1");

      expect(result.movedCount).toBe(1);
      expect(result.movedTaskIds).toEqual(["task-1"]);
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      expect(mockRepository.update).toHaveBeenCalledWith("task-1", {
        dueDate: today,
        updatedAt: expect.any(Date) as Date,
      });
    });
  });

  describe("getTasksMoveCount", () => {
    it("should return count of tasks to be moved", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const todos = [
        new TodoEntity({
          id: "task-1",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          todoType: "task",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "event-1",
          todoType: "event",
          completed: false,
          dueDate: yesterday,
          userId: "user-1",
        }),
      ];

      mockRepository.findByUserId.mockResolvedValue(todos);

      const count = await service.getTasksMoveCount("user-1");

      expect(count).toBe(2);
    });

    it("should return zero when no tasks to move", async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      const count = await service.getTasksMoveCount("user-1");

      expect(count).toBe(0);
    });
  });

  describe("getStats with todoType", () => {
    it("should calculate statistics by todo type", async () => {
      const todos = [
        // Events
        new TodoEntity({
          id: "event-1",
          todoType: "event",
          completed: false,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "event-2",
          todoType: "event",
          completed: true,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "event-3",
          todoType: "event",
          completed: false,
          userId: "user-1",
        }),
        // Tasks
        new TodoEntity({
          id: "task-1",
          todoType: "task",
          completed: false,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          todoType: "task",
          completed: true,
          userId: "user-1",
          updatedAt: new Date(), // Recent completion
        }),
      ];

      mockRepository.getStatsForUser.mockResolvedValue({
        total: 5,
        completed: 2,
        incomplete: 3,
      });
      mockRepository.findByUserIdAndCompleted.mockResolvedValue([
        todos[1],
        todos[4],
      ]);
      mockRepository.findByUserId.mockResolvedValue(todos);

      const stats = await service.getStats("user-1");

      expect(stats.byType).toEqual({
        event: {
          total: 3,
          completed: 1,
          incomplete: 2,
        },
        task: {
          total: 2,
          completed: 1,
          incomplete: 1,
        },
      });
    });

    it("should handle when all todos are one type", async () => {
      const todos = [
        new TodoEntity({
          id: "task-1",
          todoType: "task",
          completed: false,
          userId: "user-1",
        }),
        new TodoEntity({
          id: "task-2",
          todoType: "task",
          completed: true,
          userId: "user-1",
        }),
      ];

      mockRepository.getStatsForUser.mockResolvedValue({
        total: 2,
        completed: 1,
        incomplete: 1,
      });
      mockRepository.findByUserIdAndCompleted.mockResolvedValue([todos[1]]);
      mockRepository.findByUserId.mockResolvedValue(todos);

      const stats = await service.getStats("user-1");

      expect(stats.byType).toEqual({
        event: {
          total: 0,
          completed: 0,
          incomplete: 0,
        },
        task: {
          total: 2,
          completed: 1,
          incomplete: 1,
        },
      });
    });
  });
});
