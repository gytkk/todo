import { Test, TestingModule } from "@nestjs/testing";
import { TodoRepository } from "./todo.repository";
import { RedisService } from "../redis/redis.service";
import { TodoEntity } from "./todo.entity";
import { TodoCategory } from "@calendar-todo/shared-types";

describe("TodoRepository (Redis)", () => {
  let repository: TodoRepository;
  let mockRedisService: jest.Mocked<RedisService>;

  // Spy function references
  let generateKeySpy: jest.SpyInstance;
  let hgetallSpy: jest.SpyInstance;
  let hmsetSpy: jest.SpyInstance;
  let delSpy: jest.SpyInstance;
  let _zremSpy: jest.SpyInstance;
  let zrangebyscoreSpy: jest.SpyInstance;
  let zcardSpy: jest.SpyInstance;
  let scardSpy: jest.SpyInstance;

  const mockCategory: TodoCategory = {
    id: "category-1",
    name: "일반",
    color: "#3B82F6",
    createdAt: new Date("2023-01-01"),
  };

  beforeEach(async () => {
    const mockPipeline = {
      hmset: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      zrem: jest.fn().mockReturnThis(),
      sadd: jest.fn().mockReturnThis(),
      srem: jest.fn().mockReturnThis(),
      hgetall: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1], // del 명령어는 삭제된 키 수를 반환
        [null, 1], // zrem 명령어는 제거된 요소 수를 반환
        [null, "OK"],
        [null, 1],
        [null, 1],
      ]),
    };

    const mockRedis = {
      generateKey: jest.fn(),
      hgetall: jest.fn(),
      hmset: jest.fn(),
      hdel: jest.fn(),
      exists: jest.fn(),
      del: jest.fn(),
      zrange: jest.fn(),
      zadd: jest.fn(),
      zrem: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
      serializeData: jest.fn(),
      deserializeData: jest.fn(),
      scan: jest.fn(),
      keys: jest.fn(),
      ping: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      zrangebyscore: jest.fn().mockResolvedValue([]),
      zrevrange: jest.fn().mockResolvedValue([]),
      zcard: jest.fn(),
      zscore: jest.fn(),
      scard: jest.fn(),
      smembers: jest.fn().mockResolvedValue([]),
      pipeline: jest.fn(() => mockPipeline),
      multi: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoRepository,
        {
          provide: RedisService,
          useValue: mockRedis,
        },
      ],
    }).compile();

    repository = module.get<TodoRepository>(TodoRepository);
    mockRedisService = module.get<RedisService>(
      RedisService,
    ) as jest.Mocked<RedisService>;

    // Create spies for RedisService methods
    generateKeySpy = jest.spyOn(mockRedisService, "generateKey");
    hgetallSpy = jest.spyOn(mockRedisService, "hgetall");
    hmsetSpy = jest.spyOn(mockRedisService, "hmset");
    delSpy = jest.spyOn(mockRedisService, "del");
    _zremSpy = jest.spyOn(mockRedisService, "zrem");
    zrangebyscoreSpy = jest.spyOn(mockRedisService, "zrangebyscore");
    zcardSpy = jest.spyOn(mockRedisService, "zcard");
    scardSpy = jest.spyOn(mockRedisService, "scard");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should find todo by id", async () => {
      const todoId = "todo-123";
      const todoData = {
        id: todoId,
        title: "Test Todo",
        description: "Test Description",
        completed: "false",
        priority: "medium",
        categoryId: mockCategory.id,
        dueDate: "2023-12-01T00:00:00.000Z",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        userId: "user-123",
      };

      mockRedisService.generateKey.mockReturnValue(`todo:todo:${todoId}`);
      mockRedisService.hgetall.mockResolvedValue(todoData);
      mockRedisService.deserializeData.mockReturnValue(mockCategory);

      const result = await repository.findById(todoId);

      expect(result).toBeInstanceOf(TodoEntity);
      expect(result?.id).toBe(todoId);
      expect(result?.title).toBe("Test Todo");
      expect(result?.completed).toBe(false);
      expect(result?.categoryId).toBe(mockCategory.id);
      expect(generateKeySpy).toHaveBeenCalledWith("todo", todoId);
      expect(hgetallSpy).toHaveBeenCalledWith(`todo:todo:${todoId}`);
    });

    it("should return null for non-existent todo", async () => {
      const todoId = "nonexistent-todo";
      mockRedisService.generateKey.mockReturnValue(`todo:todo:${todoId}`);
      mockRedisService.hgetall.mockResolvedValue({});

      const result = await repository.findById(todoId);

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("should find todos by user id", async () => {
      const userId = "user-123";
      const todoIds = ["todo-1", "todo-2"];
      const todoData1 = {
        id: "todo-1",
        title: "Todo 1",
        description: "Description 1",
        completed: "false",
        priority: "high",
        categoryId: mockCategory.id,
        dueDate: "2023-12-01T00:00:00.000Z",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        userId: userId,
      };
      const todoData2 = {
        id: "todo-2",
        title: "Todo 2",
        description: "Description 2",
        completed: "true",
        priority: "low",
        categoryId: mockCategory.id,
        dueDate: "2023-12-02T00:00:00.000Z",
        createdAt: "2023-01-02T00:00:00.000Z",
        updatedAt: "2023-01-02T00:00:00.000Z",
        userId: userId,
      };

      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:todo:user:${userId}`,
      );
      mockRedisService.zrevrange.mockResolvedValue(todoIds);

      // Pipeline exec이 두 개의 hgetall 결과를 반환하도록 설정
      const mockPipelineForFindByUserId = {
        hgetall: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, todoData1],
          [null, todoData2],
        ]),
      };
      mockRedisService.pipeline.mockReturnValueOnce(
        mockPipelineForFindByUserId as any,
      );
      mockRedisService.deserializeData.mockReturnValue(mockCategory);

      const result = await repository.findByUserId(userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TodoEntity);
      expect(result[1]).toBeInstanceOf(TodoEntity);
      expect(result[0].id).toBe("todo-1");
      expect(result[1].id).toBe("todo-2");
    });

    it("should return empty array when no todos exist for user", async () => {
      const userId = "user-without-todos";
      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}:todos`);
      mockRedisService.zrange.mockResolvedValue([]);

      const result = await repository.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe("findByUserIdAndDateRange", () => {
    it("should find todos by user id and date range", async () => {
      const userId = "user-123";
      const startDate = new Date("2023-12-01");
      const endDate = new Date("2023-12-31");
      const todoIds = ["todo-1", "todo-2"];
      const todoData1 = {
        id: "todo-1",
        title: "Todo 1",
        description: "Description 1",
        completed: "false",
        priority: "high",
        categoryId: mockCategory.id,
        dueDate: "2023-12-15T00:00:00.000Z",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        userId: userId,
      };

      const _startTimestamp = Math.floor(startDate.getTime() / 1000);
      const _endTimestamp = Math.floor(endDate.getTime() / 1000);

      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:todo:user:${userId}`,
      );
      mockRedisService.zrangebyscore.mockResolvedValue(todoIds);

      // Pipeline exec이 하나의 hgetall 결과를 반환하도록 설정
      const mockPipelineForDateRange = {
        hgetall: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, todoData1]]),
      };
      mockRedisService.pipeline.mockReturnValueOnce(
        mockPipelineForDateRange as any,
      );
      mockRedisService.deserializeData.mockReturnValue(mockCategory);

      const result = await repository.findByUserIdAndDateRange(
        userId,
        startDate,
        endDate,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(TodoEntity);
      expect(result[0].id).toBe("todo-1");
      expect(zrangebyscoreSpy).toHaveBeenCalledWith(
        `todo:todo:user:${userId}`,
        startDate.getTime(),
        endDate.getTime(),
      );
    });
  });

  describe("findByUserIdAndCategory", () => {
    it("should find todos by user id and category", async () => {
      const userId = "user-123";
      const categoryId = "category-1";
      const todoIds = ["todo-1"];
      const todoData1 = {
        id: "todo-1",
        title: "Todo 1",
        description: "Description 1",
        completed: "false",
        priority: "high",
        categoryId: mockCategory.id,
        dueDate: "2023-12-15T00:00:00.000Z",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        userId: userId,
      };

      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:user:${userId}:index:category:${categoryId}`,
      );
      mockRedisService.smembers.mockResolvedValue(todoIds);

      // Pipeline exec이 하나의 hgetall 결과를 반환하도록 설정
      const mockPipelineForCategory = {
        hgetall: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, todoData1]]),
      };
      mockRedisService.pipeline.mockReturnValueOnce(
        mockPipelineForCategory as any,
      );
      mockRedisService.deserializeData.mockReturnValue(mockCategory);

      const result = await repository.findByUserIdAndCategory(
        userId,
        categoryId,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(TodoEntity);
      expect(result[0].id).toBe("todo-1");
      expect(result[0].categoryId).toBe(categoryId);
    });
  });

  describe("findByUserIdAndCompleted", () => {
    it("should find todos by user id and completion status", async () => {
      const userId = "user-123";
      const completed = true;
      const todoIds = ["todo-1"];
      const todoData1 = {
        id: "todo-1",
        title: "Todo 1",
        description: "Description 1",
        completed: "true",
        priority: "high",
        categoryId: mockCategory.id,
        dueDate: "2023-12-15T00:00:00.000Z",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        userId: userId,
      };

      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:user:${userId}:index:completed:${completed}`,
      );
      mockRedisService.smembers.mockResolvedValue(todoIds);

      // Pipeline exec이 하나의 hgetall 결과를 반환하도록 설정
      const mockPipelineForCompleted = {
        hgetall: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, todoData1]]),
      };
      mockRedisService.pipeline.mockReturnValueOnce(
        mockPipelineForCompleted as any,
      );
      mockRedisService.deserializeData.mockReturnValue(mockCategory);

      const result = await repository.findByUserIdAndCompleted(
        userId,
        completed,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(TodoEntity);
      expect(result[0].id).toBe("todo-1");
      expect(result[0].completed).toBe(true);
    });
  });

  describe("create", () => {
    it("should create a new todo", async () => {
      const todoData = {
        title: "New Todo",
        description: "New Description",
        userId: "user-123",
        categoryId: mockCategory.id,
        dueDate: new Date("2023-12-01"),
        priority: "high" as const,
      };

      mockRedisService.generateKey.mockReturnValue("mocked-key");
      mockRedisService.serializeData.mockReturnValue(
        JSON.stringify(mockCategory),
      );
      mockRedisService.hmset.mockResolvedValue("OK");
      mockRedisService.zadd.mockResolvedValue(1);

      const result = await repository.create(todoData);

      expect(result).toBeInstanceOf(TodoEntity);
      expect(result.title).toBe(todoData.title);
      expect(result.description).toBe(todoData.description);
      expect(result.userId).toBe(todoData.userId);
      expect(result.categoryId).toBe(mockCategory.id);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.completed).toBe(false);

      // Pipeline이 올바르게 호출되었는지 확인
      expect(mockRedisService.pipeline).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update existing todo", async () => {
      const todoId = "todo-123";
      const existingData = {
        id: todoId,
        title: "Original Todo",
        description: "Original Description",
        completed: "false",
        priority: "medium",
        categoryId: mockCategory.id,
        dueDate: "2023-12-01T00:00:00.000Z",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        userId: "user-123",
      };

      const updateData = {
        title: "Updated Todo",
        description: "Updated Description",
        priority: "high" as const,
      };

      mockRedisService.generateKey.mockReturnValue(`todo:todo:${todoId}`);
      mockRedisService.hgetall.mockResolvedValueOnce(existingData);
      mockRedisService.deserializeData.mockReturnValue(mockCategory);
      mockRedisService.serializeData.mockReturnValue(
        JSON.stringify(mockCategory),
      );
      mockRedisService.hmset.mockResolvedValue("OK");

      const result = await repository.update(todoId, updateData);

      expect(result).toBeInstanceOf(TodoEntity);
      expect(result?.title).toBe(updateData.title);
      expect(result?.description).toBe(updateData.description);
      expect(result?.priority).toBe(updateData.priority);
      expect(result?.updatedAt).not.toEqual(new Date(existingData.updatedAt));

      // Pipeline이 올바르게 호출되었는지 확인
      expect(mockRedisService.pipeline).toHaveBeenCalled();
    });

    it("should return null for non-existent todo", async () => {
      const todoId = "nonexistent-todo";
      mockRedisService.generateKey.mockReturnValue(`todo:todo:${todoId}`);
      mockRedisService.hgetall.mockResolvedValue({});

      const result = await repository.update(todoId, { title: "Updated" });

      expect(result).toBeNull();
      expect(hmsetSpy).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete existing todo", async () => {
      const todoId = "todo-123";
      const todoData = {
        id: todoId,
        title: "Test Todo",
        description: "Test Description",
        completed: "false",
        priority: "medium",
        categoryId: mockCategory.id,
        dueDate: "2023-12-01T00:00:00.000Z",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        userId: "user-123",
      };

      mockRedisService.generateKey.mockReturnValueOnce(`todo:todo:${todoId}`);
      mockRedisService.hgetall.mockResolvedValue(todoData);
      mockRedisService.deserializeData.mockReturnValue(mockCategory);
      mockRedisService.generateKey.mockReturnValueOnce(`todo:todo:${todoId}`);
      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:user:${todoData.userId}:todos`,
      );
      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:user:${todoData.userId}:todos:bydate`,
      );
      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:user:${todoData.userId}:category:${mockCategory.id}`,
      );
      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:user:${todoData.userId}:completed:false`,
      );
      mockRedisService.del.mockResolvedValue(1);
      mockRedisService.zrem.mockResolvedValue(1);

      const result = await repository.delete(todoId);

      expect(result).toBe(true);
      // Pipeline이 올바르게 호출되었는지 확인
      expect(mockRedisService.pipeline).toHaveBeenCalled();
    });

    it("should return false for non-existent todo", async () => {
      const todoId = "nonexistent-todo";
      mockRedisService.generateKey.mockReturnValue(`todo:todo:${todoId}`);
      mockRedisService.hgetall.mockResolvedValue({});

      const result = await repository.delete(todoId);

      expect(result).toBe(false);
      expect(delSpy).not.toHaveBeenCalled();
    });
  });

  describe("toggle", () => {
    it("should toggle todo completion status", async () => {
      const todoId = "todo-123";
      const todoData = {
        id: todoId,
        title: "Test Todo",
        description: "Test Description",
        completed: "false",
        priority: "medium",
        categoryId: mockCategory.id,
        dueDate: "2023-12-01T00:00:00.000Z",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        userId: "user-123",
      };

      mockRedisService.generateKey.mockReturnValue(`todo:todo:${todoId}`);
      mockRedisService.hgetall.mockResolvedValue(todoData);
      mockRedisService.deserializeData.mockReturnValue(mockCategory);
      mockRedisService.serializeData.mockReturnValue(
        JSON.stringify(mockCategory),
      );
      mockRedisService.hmset.mockResolvedValue("OK");
      mockRedisService.zrem.mockResolvedValue(1);
      mockRedisService.zadd.mockResolvedValue(1);

      const result = await repository.toggle(todoId);

      expect(result).toBeInstanceOf(TodoEntity);
      expect(result?.completed).toBe(true);
      expect(result?.updatedAt).not.toEqual(new Date(todoData.updatedAt));

      // Pipeline이 올바르게 호출되었는지 확인
      expect(mockRedisService.pipeline).toHaveBeenCalled();
    });
  });

  describe("count operations", () => {
    it("should count todos by user id", async () => {
      const userId = "user-123";
      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}:todos`);
      mockRedisService.zcard.mockResolvedValue(5);

      const result = await repository.countByUserId(userId);

      expect(result).toBe(5);
      expect(zcardSpy).toHaveBeenCalledWith(`todo:user:${userId}:todos`);
    });

    it("should count todos by user id and completion status", async () => {
      const userId = "user-123";
      const completed = true;
      mockRedisService.generateKey.mockReturnValue(
        `todo:user:${userId}:index:completed:${completed}`,
      );
      mockRedisService.scard.mockResolvedValue(3);

      const result = await repository.countByUserIdAndCompleted(
        userId,
        completed,
      );

      expect(result).toBe(3);
      expect(scardSpy).toHaveBeenCalledWith(
        `todo:user:${userId}:index:completed:${completed}`,
      );
    });
  });
});
