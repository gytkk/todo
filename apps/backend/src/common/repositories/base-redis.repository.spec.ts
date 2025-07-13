import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "../../redis/redis.service";
import { BaseRedisRepository } from "./base-redis.repository";

// Test entity for testing purposes
interface TestEntity {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Concrete implementation of BaseRedisRepository for testing
class TestRedisRepository extends BaseRedisRepository<TestEntity> {
  protected entityName = "test";

  protected serialize(entity: TestEntity): Record<string, string> {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  protected deserialize(data: Record<string, string>): TestEntity {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  protected createEntity(data: Partial<TestEntity>): TestEntity {
    const now = new Date().toISOString();
    return {
      id: data.id || `test-${Date.now()}`,
      name: data.name || "",
      email: data.email || "",
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
  }

  protected updateEntity(
    existing: TestEntity,
    updates: Partial<TestEntity>,
  ): TestEntity {
    return {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
}

describe("BaseRedisRepository", () => {
  let repository: TestRedisRepository;
  let redisService: jest.Mocked<RedisService>;

  const mockPipeline = {
    hgetall: jest.fn(),
    hmset: jest.fn(),
    zadd: jest.fn(),
    del: jest.fn(),
    zrem: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const mockRedisService = {
      generateKey: jest.fn(),
      hgetall: jest.fn(),
      hmset: jest.fn(),
      zrange: jest.fn(),
      zrevrange: jest.fn(),
      zcard: jest.fn(),
      exists: jest.fn(),
      del: jest.fn(),
      zadd: jest.fn(),
      zrem: jest.fn(),
      pipeline: jest.fn(() => mockPipeline),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestRedisRepository,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    repository = module.get<TestRedisRepository>(TestRedisRepository);
    redisService = module.get(RedisService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    mockPipeline.exec.mockResolvedValue([]);
  });

  describe("key generation", () => {
    beforeEach(() => {
      redisService.generateKey.mockImplementation(
        (type: string, ...parts: string[]) => {
          return ["todo", type, ...parts].join(":");
        },
      );
    });

    it("should generate entity key correctly", () => {
      const id = "test-123";
      const key = repository["generateKey"](id);

      expect(redisService.generateKey).toHaveBeenCalledWith("test", id);
      expect(key).toBe("todo:test:test-123");
    });

    it("should generate list key correctly", () => {
      const key = repository["generateListKey"]();

      expect(redisService.generateKey).toHaveBeenCalledWith("test", "list");
      expect(key).toBe("todo:test:list");
    });

    it("should generate index key correctly", () => {
      const field = "email";
      const value = "test@example.com";
      const key = repository["generateIndexKey"](field, value);

      expect(redisService.generateKey).toHaveBeenCalledWith(
        "test",
        "index",
        field,
        value,
      );
      expect(key).toBe("todo:test:index:email:test@example.com");
    });
  });

  describe("findById", () => {
    beforeEach(() => {
      redisService.generateKey.mockReturnValue("todo:test:test-123");
    });

    it("should find entity by id", async () => {
      const testData = {
        id: "test-123",
        name: "Test User",
        email: "test@example.com",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };
      redisService.hgetall.mockResolvedValue(testData);

      const result = await repository.findById("test-123");

      expect(result).toEqual(testData);
      expect(redisService.generateKey).toHaveBeenCalledWith("test", "test-123");
      expect(redisService.hgetall).toHaveBeenCalledWith("todo:test:test-123");
    });

    it("should return null for non-existent entity", async () => {
      redisService.hgetall.mockResolvedValue({});

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });

    it("should return null for empty data", async () => {
      redisService.hgetall.mockResolvedValue(null as any);

      const result = await repository.findById("test-123");

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    beforeEach(() => {
      redisService.generateKey.mockReturnValue("todo:test:list");
    });

    it("should find all entities", async () => {
      const ids = ["test-1", "test-2"];
      const entities = [
        {
          id: "test-1",
          name: "User 1",
          email: "user1@example.com",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
        {
          id: "test-2",
          name: "User 2",
          email: "user2@example.com",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      ];

      redisService.zrange.mockResolvedValue(ids);
      mockPipeline.exec.mockResolvedValue([
        [null, entities[0]],
        [null, entities[1]],
      ]);

      const result = await repository.findAll();

      expect(result).toEqual(entities);
      expect(redisService.zrange).toHaveBeenCalledWith("todo:test:list", 0, -1);
    });

    it("should return empty array when no entities exist", async () => {
      redisService.zrange.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findByIds", () => {
    it("should find entities by ids", async () => {
      const ids = ["test-1", "test-2"];
      const entities = [
        {
          id: "test-1",
          name: "User 1",
          email: "user1@example.com",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
        {
          id: "test-2",
          name: "User 2",
          email: "user2@example.com",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      ];

      mockPipeline.exec.mockResolvedValue([
        [null, entities[0]],
        [null, entities[1]],
      ]);

      const result = await repository.findByIds(ids);

      expect(result).toEqual(entities);
      expect(redisService.pipeline).toHaveBeenCalled();
      expect(mockPipeline.hgetall).toHaveBeenCalledTimes(2);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it("should return empty array for empty ids", async () => {
      const result = await repository.findByIds([]);

      expect(result).toEqual([]);
      expect(redisService.pipeline).not.toHaveBeenCalled();
    });

    it("should handle pipeline errors", async () => {
      const ids = ["test-1", "test-2"];
      mockPipeline.exec.mockResolvedValue([
        ["error", null],
        [null, { id: "test-2", name: "User 2", email: "user2@example.com" }],
      ]);

      const result = await repository.findByIds(ids);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("test-2");
    });

    it("should handle null pipeline results", async () => {
      const ids = ["test-1"];
      mockPipeline.exec.mockResolvedValue(null);

      const result = await repository.findByIds(ids);

      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    beforeEach(() => {
      redisService.generateKey.mockImplementation(
        (type, id) => `todo:${type}:${id}`,
      );
    });

    it("should create new entity", async () => {
      const entityData = {
        name: "New User",
        email: "new@example.com",
      };

      jest.spyOn(Date, "now").mockReturnValue(1640995200000); // 2022-01-01
      mockPipeline.exec.mockResolvedValue([
        [null, "OK"],
        [null, 1],
      ]);

      const result = await repository.create(entityData);

      expect(result.name).toBe(entityData.name);
      expect(result.email).toBe(entityData.email);
      expect(result.id).toBe("test-1640995200000");
      expect(mockPipeline.hmset).toHaveBeenCalled();
      expect(mockPipeline.zadd).toHaveBeenCalled();
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it("should create entity with provided id", async () => {
      const entityData = {
        id: "custom-id",
        name: "User with custom ID",
        email: "custom@example.com",
      };

      mockPipeline.exec.mockResolvedValue([
        [null, "OK"],
        [null, 1],
      ]);

      const result = await repository.create(entityData);

      expect(result.id).toBe("custom-id");
      expect(result.name).toBe(entityData.name);
      expect(result.email).toBe(entityData.email);
    });
  });

  describe("update", () => {
    beforeEach(() => {
      redisService.generateKey.mockImplementation(
        (type, id) => `todo:${type}:${id}`,
      );
    });

    it("should update existing entity", async () => {
      const existingEntity = {
        id: "test-123",
        name: "Old Name",
        email: "old@example.com",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };
      const updates = {
        name: "New Name",
        email: "new@example.com",
      };

      redisService.hgetall.mockResolvedValue(existingEntity);
      mockPipeline.exec.mockResolvedValue([[null, "OK"]]);

      const result = await repository.update("test-123", updates);

      expect(result?.name).toBe(updates.name);
      expect(result?.email).toBe(updates.email);
      expect(result?.id).toBe(existingEntity.id);
      expect(result?.createdAt).toBe(existingEntity.createdAt);
      expect(result?.updatedAt).not.toBe(existingEntity.updatedAt);
      expect(mockPipeline.hmset).toHaveBeenCalled();
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it("should return null for non-existent entity", async () => {
      redisService.hgetall.mockResolvedValue({});

      const result = await repository.update("non-existent", {
        name: "New Name",
      });

      expect(result).toBeNull();
      expect(mockPipeline.hmset).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    beforeEach(() => {
      redisService.generateKey.mockImplementation(
        (type, ...parts) => `todo:${type}:${parts.join(":")}`,
      );
    });

    it("should delete existing entity", async () => {
      const existingEntity = {
        id: "test-123",
        name: "User to Delete",
        email: "delete@example.com",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };

      redisService.hgetall.mockResolvedValue(existingEntity);
      mockPipeline.exec.mockResolvedValue([
        [null, 1],
        [null, 1],
      ]);

      const result = await repository.delete("test-123");

      expect(result).toBe(true);
      expect(mockPipeline.del).toHaveBeenCalledWith("todo:test:test-123");
      expect(mockPipeline.zrem).toHaveBeenCalledWith(
        "todo:test:list",
        "test-123",
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it("should return false for non-existent entity", async () => {
      redisService.hgetall.mockResolvedValue({});

      const result = await repository.delete("non-existent");

      expect(result).toBe(false);
      expect(mockPipeline.del).not.toHaveBeenCalled();
    });

    it("should handle pipeline execution failure", async () => {
      const existingEntity = {
        id: "test-123",
        name: "User",
        email: "user@example.com",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };

      redisService.hgetall.mockResolvedValue(existingEntity);
      mockPipeline.exec.mockResolvedValue(null);

      const result = await repository.delete("test-123");

      expect(result).toBe(false);
    });
  });

  describe("exists", () => {
    beforeEach(() => {
      redisService.generateKey.mockReturnValue("todo:test:test-123");
    });

    it("should return true for existing entity", async () => {
      redisService.exists.mockResolvedValue(true);

      const result = await repository.exists("test-123");

      expect(result).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith("todo:test:test-123");
    });

    it("should return false for non-existent entity", async () => {
      redisService.exists.mockResolvedValue(false);

      const result = await repository.exists("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("findPaginated", () => {
    beforeEach(() => {
      redisService.generateKey.mockReturnValue("todo:test:list");
    });

    it("should return paginated results", async () => {
      const entities = [
        {
          id: "test-1",
          name: "User 1",
          email: "user1@example.com",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
        {
          id: "test-2",
          name: "User 2",
          email: "user2@example.com",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      ];

      redisService.zcard.mockResolvedValue(10);
      redisService.zrevrange.mockResolvedValue(["test-1", "test-2"]);
      mockPipeline.exec.mockResolvedValue([
        [null, entities[0]],
        [null, entities[1]],
      ]);

      const result = await repository.findPaginated({ page: 1, limit: 2 });

      expect(result.items).toEqual(entities);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
      expect(redisService.zrevrange).toHaveBeenCalledWith(
        "todo:test:list",
        0,
        1,
      );
    });

    it("should handle second page correctly", async () => {
      redisService.zcard.mockResolvedValue(10);
      redisService.zrevrange.mockResolvedValue(["test-3", "test-4"]);
      mockPipeline.exec.mockResolvedValue([]);

      const result = await repository.findPaginated({ page: 2, limit: 2 });

      expect(result.page).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
      expect(redisService.zrevrange).toHaveBeenCalledWith(
        "todo:test:list",
        2,
        3,
      );
    });

    it("should handle last page correctly", async () => {
      redisService.zcard.mockResolvedValue(5);
      redisService.zrevrange.mockResolvedValue(["test-5"]);
      mockPipeline.exec.mockResolvedValue([]);

      const result = await repository.findPaginated({ page: 3, limit: 2 });

      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });
  });

  describe("abstract methods implementation", () => {
    it("should call updateIndexes during create", async () => {
      const updateIndexesSpy = jest.spyOn(repository as any, "updateIndexes");
      updateIndexesSpy.mockImplementation(() => Promise.resolve());

      mockPipeline.exec.mockResolvedValue([
        [null, "OK"],
        [null, 1],
      ]);

      await repository.create({ name: "Test", email: "test@example.com" });

      expect(updateIndexesSpy).toHaveBeenCalledWith(
        mockPipeline,
        expect.any(Object),
        null,
      );
    });

    it("should call updateIndexes during update", async () => {
      const existingEntity = {
        id: "test-123",
        name: "Old Name",
        email: "old@example.com",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };

      redisService.hgetall.mockResolvedValue(existingEntity);
      mockPipeline.exec.mockResolvedValue([[null, "OK"]]);

      const updateIndexesSpy = jest.spyOn(repository as any, "updateIndexes");
      updateIndexesSpy.mockImplementation(() => Promise.resolve());

      await repository.update("test-123", { name: "New Name" });

      expect(updateIndexesSpy).toHaveBeenCalledWith(
        mockPipeline,
        expect.any(Object),
        existingEntity,
      );
    });

    it("should call removeFromIndexes during delete", async () => {
      const existingEntity = {
        id: "test-123",
        name: "User",
        email: "user@example.com",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };

      redisService.hgetall.mockResolvedValue(existingEntity);
      mockPipeline.exec.mockResolvedValue([
        [null, 1],
        [null, 1],
      ]);

      const removeFromIndexesSpy = jest.spyOn(
        repository as any,
        "removeFromIndexes",
      );
      removeFromIndexesSpy.mockImplementation(() => Promise.resolve());

      await repository.delete("test-123");

      expect(removeFromIndexesSpy).toHaveBeenCalledWith(
        mockPipeline,
        existingEntity,
      );
    });
  });
});
