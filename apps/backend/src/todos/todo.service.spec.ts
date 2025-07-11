import { Test, TestingModule } from "@nestjs/testing";
import { TodoService } from "./todo.service";
import { TodoRepository } from "./todo.repository";
import { TodoEntity } from "./todo.entity";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";
import { TodoItem, TodoCategory } from "@calendar-todo/shared-types";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { subDays } from "date-fns";

describe("TodoService", () => {
  let service: TodoService;

  const mockCategory: TodoCategory = {
    id: "work",
    name: "업무",
    color: "#FF6B6B",
    isDefault: false,
    createdAt: new Date("2023-01-01"),
  };

  const mockTodoEntity: TodoEntity = new TodoEntity({
    id: "todo-1",
    title: "테스트 할일",
    description: "테스트 설명",
    completed: false,
    priority: "high",
    category: mockCategory,
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        {
          provide: TodoRepository,
          useValue: mockRepository,
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
        category: createTodoDto.category,
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

      const incompleteTodo = new TodoEntity({
        ...mockTodoEntity,
        id: "todo-4",
        completed: false,
      });

      const allTodos = [
        mockTodoEntity,
        completedTodo,
        oldCompletedTodo,
        incompleteTodo,
      ];
      mockRepository.findByUserId.mockResolvedValue(allTodos);

      const result = await service.getStats("user-1");

      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-1");
      expect(result).toEqual({
        total: 4,
        completed: 2,
        incomplete: 2,
        completionRate: 50,
        recentCompletions: 1,
      });
    });

    it("할일이 없을 때 기본 통계를 반환해야 함", async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getStats("user-1");

      expect(result).toEqual({
        total: 0,
        completed: 0,
        incomplete: 0,
        completionRate: 0,
        recentCompletions: 0,
      });
    });
  });

  describe("removeAllByUserId", () => {
    it("사용자의 모든 할일을 삭제해야 함", async () => {
      mockRepository.deleteByUserId.mockResolvedValue(5);

      const result = await service.removeAllByUserId("user-1");

      expect(mockRepository.deleteByUserId).toHaveBeenCalledWith("user-1");
      expect(result).toBe(5);
    });
  });

  describe("updateCategoryForUser", () => {
    it("사용자의 카테고리를 업데이트해야 함", async () => {
      const oldCategory: TodoCategory = {
        id: "old-category",
        name: "이전 카테고리",
        color: "#000000",
        isDefault: false,
        createdAt: new Date(),
      };

      const newCategory: TodoCategory = {
        id: "new-category",
        name: "새 카테고리",
        color: "#ffffff",
        isDefault: false,
        createdAt: new Date(),
      };

      mockRepository.updateCategoryForUser.mockResolvedValue(3);

      const result = await service.updateCategoryForUser(
        "user-1",
        oldCategory,
        newCategory,
      );

      expect(mockRepository.updateCategoryForUser).toHaveBeenCalledWith(
        "user-1",
        oldCategory,
        newCategory,
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
          date: new Date("2024-01-15"),
        },
        {
          title: "할일 2",
          completed: true,
          category: mockCategory,
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
});
