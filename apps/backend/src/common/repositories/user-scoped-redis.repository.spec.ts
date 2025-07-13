import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "../../redis/redis.service";
import { UserScopedRedisRepository } from "./user-scoped-redis.repository";

// Test entity for testing purposes
interface TestUserEntity {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Concrete implementation of UserScopedRedisRepository for testing
class TestUserRepository extends UserScopedRedisRepository<TestUserEntity> {
  protected entityName = "testuser";

  protected serialize(entity: TestUserEntity): Record<string, string> {
    return {
      id: entity.id,
      userId: entity.userId,
      title: entity.title,
      content: entity.content,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  protected deserialize(data: Record<string, string>): TestUserEntity {
    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      content: data.content,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  protected createEntity(data: Partial<TestUserEntity>): TestUserEntity {
    const now = new Date();
    return {
      id: data.id || `test-${Date.now()}`,
      userId: data.userId || "",
      title: data.title || "",
      content: data.content || "",
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
  }

  protected updateEntity(
    existing: TestUserEntity,
    updates: Partial<TestUserEntity>,
  ): TestUserEntity {
    return {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
  }
}

describe("UserScopedRedisRepository", () => {
  let repository: TestUserRepository;
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
      zrangebyscore: jest.fn(),
      zcard: jest.fn(),
      exists: jest.fn(),
      del: jest.fn(),
      zadd: jest.fn(),
      zrem: jest.fn(),
      pipeline: jest.fn(() => mockPipeline),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestUserRepository,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    repository = module.get<TestUserRepository>(TestUserRepository);
    redisService = module.get(RedisService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    mockPipeline.exec.mockResolvedValue([]);
  });

  describe("user-specific key generation", () => {
    beforeEach(() => {
      redisService.generateKey.mockImplementation((...parts: string[]) =>
        parts.join(":"),
      );
    });

    it("should generate user list key correctly", () => {
      const userId = "user-123";
      const key = repository["generateUserListKey"](userId);

      expect(redisService.generateKey).toHaveBeenCalledWith(
        "testuser",
        "user",
        userId,
      );
      expect(key).toBe("testuser:user:user-123");
    });

    it("should generate user index key correctly", () => {
      const userId = "user-123";
      const field = "status";
      const value = "active";
      const key = repository["generateUserIndexKey"](userId, field, value);

      expect(redisService.generateKey).toHaveBeenCalledWith(
        "testuser",
        "user",
        userId,
        "index",
        field,
        value,
      );
      expect(key).toBe("testuser:user:user-123:index:status:active");
    });
  });

  describe("findByUserId", () => {
    beforeEach(() => {
      redisService.generateKey.mockReturnValue("testuser:user:user-123");
    });

    it("should find entities by user id", async () => {
      const userId = "user-123";
      const ids = ["item-1", "item-2"];

      redisService.zrevrange.mockResolvedValue(ids);
      mockPipeline.exec.mockResolvedValue([
        [
          null,
          {
            id: "item-1",
            userId: "user-123",
            title: "Item 1",
            content: "Content 1",
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-01-01T00:00:00.000Z",
          },
        ],
        [
          null,
          {
            id: "item-2",
            userId: "user-123",
            title: "Item 2",
            content: "Content 2",
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-01-01T00:00:00.000Z",
          },
        ],
      ]);

      const result = await repository.findByUserId(userId);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId);
      expect(result[1].userId).toBe(userId);
      expect(redisService.zrevrange).toHaveBeenCalledWith(
        "testuser:user:user-123",
        0,
        -1,
      );
    });

    it("should return empty array when user has no entities", async () => {
      const userId = "user-123";
      redisService.zrevrange.mockResolvedValue([]);

      const result = await repository.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe("findByUserIdAndId", () => {
    it("should find entity by user id and entity id", async () => {
      const userId = "user-123";
      const entityId = "item-1";
      const entity = {
        id: entityId,
        userId: userId,
        title: "Test Item",
        content: "Test Content",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      redisService.hgetall.mockResolvedValue(entity);

      const result = await repository.findByUserIdAndId(userId, entityId);

      expect(result?.id).toBe(entityId);
      expect(result?.userId).toBe(userId);
    });

    it("should return null when entity does not exist", async () => {
      redisService.hgetall.mockResolvedValue({});

      const result = await repository.findByUserIdAndId(
        "user-123",
        "non-existent",
      );

      expect(result).toBeNull();
    });

    it("should return null when entity belongs to different user", async () => {
      const entity = {
        id: "item-1",
        userId: "different-user",
        title: "Test Item",
        content: "Test Content",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      redisService.hgetall.mockResolvedValue(entity);

      const result = await repository.findByUserIdAndId("user-123", "item-1");

      expect(result).toBeNull();
    });
  });

  describe("deleteByUserId", () => {
    beforeEach(() => {
      redisService.generateKey.mockImplementation((...parts: string[]) =>
        parts.join(":"),
      );
    });

    it("should delete all entities for a user", async () => {
      const userId = "user-123";
      const ids = ["item-1", "item-2"];

      redisService.zrange.mockResolvedValue(ids);
      mockPipeline.exec.mockResolvedValue([
        [null, 1], // del item-1
        [null, 1], // del item-2
        [null, 1], // del user list
        [null, 1], // zrem global item-1
        [null, 1], // zrem global item-2
      ]);

      const result = await repository.deleteByUserId(userId);

      expect(result).toBe(true);
      expect(mockPipeline.del).toHaveBeenCalledTimes(3); // 2 items + user list
      expect(mockPipeline.zrem).toHaveBeenCalledTimes(2); // global list removals
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it("should return true when user has no entities", async () => {
      const userId = "user-123";
      redisService.zrange.mockResolvedValue([]);

      const result = await repository.deleteByUserId(userId);

      expect(result).toBe(true);
      expect(mockPipeline.del).not.toHaveBeenCalled();
    });

    it("should handle pipeline execution failure", async () => {
      const userId = "user-123";
      redisService.zrange.mockResolvedValue(["item-1"]);
      mockPipeline.exec.mockResolvedValue(null);

      const result = await repository.deleteByUserId(userId);

      expect(result).toBe(false);
    });
  });

  describe("countByUserId", () => {
    beforeEach(() => {
      redisService.generateKey.mockReturnValue("testuser:user:user-123");
    });

    it("should count entities for user", async () => {
      const userId = "user-123";
      const expectedCount = 5;
      redisService.zcard.mockResolvedValue(expectedCount);

      const result = await repository.countByUserId(userId);

      expect(result).toBe(expectedCount);
      expect(redisService.zcard).toHaveBeenCalledWith("testuser:user:user-123");
    });

    it("should return 0 when user has no entities", async () => {
      const userId = "user-123";
      redisService.zcard.mockResolvedValue(0);

      const result = await repository.countByUserId(userId);

      expect(result).toBe(0);
    });
  });

  describe("findByUserIdAndDateRange", () => {
    beforeEach(() => {
      redisService.generateKey.mockReturnValue("testuser:user:user-123");
    });

    it("should find entities within date range", async () => {
      const userId = "user-123";
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-01-31");
      const ids = ["item-1", "item-2"];

      redisService.zrangebyscore.mockResolvedValue(ids);
      mockPipeline.exec.mockResolvedValue([
        [
          null,
          {
            id: "item-1",
            userId: "user-123",
            title: "Item 1",
            content: "Content 1",
            createdAt: "2023-01-15T00:00:00.000Z",
            updatedAt: "2023-01-15T00:00:00.000Z",
          },
        ],
        [
          null,
          {
            id: "item-2",
            userId: "user-123",
            title: "Item 2",
            content: "Content 2",
            createdAt: "2023-01-20T00:00:00.000Z",
            updatedAt: "2023-01-20T00:00:00.000Z",
          },
        ],
      ]);

      const result = await repository.findByUserIdAndDateRange(
        userId,
        startDate,
        endDate,
      );

      expect(result).toHaveLength(2);
      expect(redisService.zrangebyscore).toHaveBeenCalledWith(
        "testuser:user:user-123",
        startDate.getTime(),
        endDate.getTime(),
      );
    });

    it("should return empty array when no entities in date range", async () => {
      const userId = "user-123";
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-01-31");

      redisService.zrangebyscore.mockResolvedValue([]);

      const result = await repository.findByUserIdAndDateRange(
        userId,
        startDate,
        endDate,
      );

      expect(result).toEqual([]);
    });
  });

  describe("index management", () => {
    it("should call user-specific index methods during update", async () => {
      const updateUserIndexesSpy = jest.spyOn(
        repository as any,
        "updateUserIndexes",
      );
      updateUserIndexesSpy.mockImplementation(() => undefined);

      const newEntity = {
        id: "item-1",
        userId: "user-123",
        title: "New Title",
        content: "New Content",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await repository["updateIndexes"](mockPipeline as any, newEntity, null);

      expect(updateUserIndexesSpy).toHaveBeenCalledWith(
        mockPipeline,
        newEntity,
        null,
      );
      expect(mockPipeline.zadd).toHaveBeenCalled();
    });

    it("should call user-specific cleanup methods during removal", async () => {
      const removeUserEntityIndexesSpy = jest.spyOn(
        repository as any,
        "removeUserEntityIndexes",
      );
      removeUserEntityIndexesSpy.mockImplementation(() => undefined);

      const entity = {
        id: "item-1",
        userId: "user-123",
        title: "Title",
        content: "Content",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await repository["removeFromIndexes"](mockPipeline as any, entity);

      expect(removeUserEntityIndexesSpy).toHaveBeenCalledWith(
        mockPipeline,
        entity,
      );
      expect(mockPipeline.zrem).toHaveBeenCalled();
    });

    it("should call removeUserIndexes during deleteByUserId", async () => {
      const removeUserIndexesSpy = jest.spyOn(
        repository as any,
        "removeUserIndexes",
      );
      removeUserIndexesSpy.mockImplementation(() => undefined);

      const userId = "user-123";
      redisService.zrange.mockResolvedValue(["item-1"]);
      mockPipeline.exec.mockResolvedValue([[null, 1]]);

      await repository.deleteByUserId(userId);

      expect(removeUserIndexesSpy).toHaveBeenCalledWith(mockPipeline, userId);
    });
  });

  describe("timestamp handling in zadd", () => {
    it("should use entity createdAt timestamp for zadd", async () => {
      const entity = {
        id: "item-1",
        userId: "user-123",
        title: "Title",
        content: "Content",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date(),
      };

      redisService.generateKey.mockReturnValue("testuser:user:user-123");

      await repository["updateIndexes"](mockPipeline as any, entity, null);

      expect(mockPipeline.zadd).toHaveBeenCalledWith(
        "testuser:user:user-123",
        entity.createdAt.getTime(),
        entity.id,
      );
    });

    it("should use current timestamp when createdAt is not available", async () => {
      const entity = {
        id: "item-1",
        userId: "user-123",
        title: "Title",
        content: "Content",
        updatedAt: new Date(),
      } as TestUserEntity;

      redisService.generateKey.mockReturnValue("testuser:user:user-123");
      const dateSpy = jest.spyOn(Date, "now").mockReturnValue(1640995200000);

      await repository["updateIndexes"](mockPipeline as any, entity, null);

      expect(mockPipeline.zadd).toHaveBeenCalledWith(
        "testuser:user:user-123",
        1640995200000,
        entity.id,
      );

      dateSpy.mockRestore();
    });
  });
});
