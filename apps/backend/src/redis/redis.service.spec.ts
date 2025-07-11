import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";

// Mock Redis completely
const mockRedis = {
  ping: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  hget: jest.fn(),
  hset: jest.fn(),
  hdel: jest.fn(),
  hgetall: jest.fn(),
  hmset: jest.fn(),
  zadd: jest.fn(),
  zrem: jest.fn(),
  zrange: jest.fn(),
  zrangebyscore: jest.fn(),
  zrevrange: jest.fn(),
  zcard: jest.fn(),
  zscore: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  flushdb: jest.fn(),
  keys: jest.fn(),
  scan: jest.fn(),
  pipeline: jest.fn(() => ({
    exec: jest.fn(),
  })),
  multi: jest.fn(() => ({
    exec: jest.fn(),
  })),
  disconnect: jest.fn(),
  status: "ready",
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock("ioredis", () => {
  return {
    default: jest.fn(() => mockRedis),
    __esModule: true,
  };
});

describe("RedisService", () => {
  let service: RedisService;
  let _configService: ConfigService;

  beforeEach(async () => {
    // Clear all mock calls before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string | number> = {
                REDIS_HOST: "localhost",
                REDIS_PORT: 6379,
                REDIS_PASSWORD: "test123",
                REDIS_DB: 0,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    _configService = module.get<ConfigService>(ConfigService);
  });

  describe("initialization", () => {
    it("should be defined", () => {
      expect(service).toBeDefined();
    });
  });

  describe("health check", () => {
    it("should return true when Redis is healthy", async () => {
      mockRedis.ping.mockResolvedValue("PONG");

      const result = await service.ping();

      expect(result).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it("should return false when Redis ping fails", async () => {
      mockRedis.ping.mockRejectedValue(new Error("Connection failed"));

      const result = await service.ping();

      expect(result).toBe(false);
      expect(mockRedis.ping).toHaveBeenCalled();
    });
  });

  describe("basic operations", () => {
    describe("get", () => {
      it("should get value by key", async () => {
        const testKey = "test:key";
        const testValue = "test:value";
        mockRedis.get.mockResolvedValue(testValue);

        const result = await service.get(testKey);

        expect(result).toBe(testValue);
        expect(mockRedis.get).toHaveBeenCalledWith(testKey);
      });

      it("should return null for non-existent key", async () => {
        const testKey = "nonexistent:key";
        mockRedis.get.mockResolvedValue(null);

        const result = await service.get(testKey);

        expect(result).toBeNull();
        expect(mockRedis.get).toHaveBeenCalledWith(testKey);
      });
    });

    describe("set", () => {
      it("should set key-value pair", async () => {
        const testKey = "test:key";
        const testValue = "test:value";
        mockRedis.set.mockResolvedValue("OK");

        const result = await service.set(testKey, testValue);

        expect(result).toBe("OK");
        expect(mockRedis.set).toHaveBeenCalledWith(testKey, testValue);
      });

      it("should set key-value pair with TTL", async () => {
        const testKey = "test:key";
        const testValue = "test:value";
        const ttl = 3600;
        mockRedis.set.mockResolvedValue("OK");

        const result = await service.set(testKey, testValue, ttl);

        expect(result).toBe("OK");
        expect(mockRedis.set).toHaveBeenCalledWith(
          testKey,
          testValue,
          "EX",
          ttl,
        );
      });
    });

    describe("del", () => {
      it("should delete key", async () => {
        const testKey = "test:key";
        mockRedis.del.mockResolvedValue(1);

        const result = await service.del(testKey);

        expect(result).toBe(1);
        expect(mockRedis.del).toHaveBeenCalledWith(testKey);
      });

      it("should return 0 for non-existent key", async () => {
        const testKey = "nonexistent:key";
        mockRedis.del.mockResolvedValue(0);

        const result = await service.del(testKey);

        expect(result).toBe(0);
        expect(mockRedis.del).toHaveBeenCalledWith(testKey);
      });
    });

    describe("exists", () => {
      it("should return true for existing key", async () => {
        const testKey = "test:key";
        mockRedis.exists.mockResolvedValue(1);

        const result = await service.exists(testKey);

        expect(result).toBe(true);
        expect(mockRedis.exists).toHaveBeenCalledWith(testKey);
      });

      it("should return false for non-existent key", async () => {
        const testKey = "nonexistent:key";
        mockRedis.exists.mockResolvedValue(0);

        const result = await service.exists(testKey);

        expect(result).toBe(false);
        expect(mockRedis.exists).toHaveBeenCalledWith(testKey);
      });
    });
  });

  describe("hash operations", () => {
    describe("hget", () => {
      it("should get hash field value", async () => {
        const testKey = "test:hash";
        const testField = "field1";
        const testValue = "value1";
        mockRedis.hget.mockResolvedValue(testValue);

        const result = await service.hget(testKey, testField);

        expect(result).toBe(testValue);
        expect(mockRedis.hget).toHaveBeenCalledWith(testKey, testField);
      });
    });

    describe("hset", () => {
      it("should set hash field value", async () => {
        const testKey = "test:hash";
        const testField = "field1";
        const testValue = "value1";
        mockRedis.hset.mockResolvedValue(1);

        const result = await service.hset(testKey, testField, testValue);

        expect(result).toBe(1);
        expect(mockRedis.hset).toHaveBeenCalledWith(
          testKey,
          testField,
          testValue,
        );
      });
    });

    describe("hgetall", () => {
      it("should get all hash fields and values", async () => {
        const testKey = "test:hash";
        const testHash = { field1: "value1", field2: "value2" };
        mockRedis.hgetall.mockResolvedValue(testHash);

        const result = await service.hgetall(testKey);

        expect(result).toEqual(testHash);
        expect(mockRedis.hgetall).toHaveBeenCalledWith(testKey);
      });
    });

    describe("hmset", () => {
      it("should set multiple hash fields", async () => {
        const testKey = "test:hash";
        const testHash = { field1: "value1", field2: "value2" };
        mockRedis.hmset.mockResolvedValue("OK");

        const result = await service.hmset(testKey, testHash);

        expect(result).toBe("OK");
        expect(mockRedis.hmset).toHaveBeenCalledWith(testKey, testHash);
      });
    });

    describe("hdel", () => {
      it("should delete hash field", async () => {
        const testKey = "test:hash";
        const testField = "field1";
        mockRedis.hdel.mockResolvedValue(1);

        const result = await service.hdel(testKey, testField);

        expect(result).toBe(1);
        expect(mockRedis.hdel).toHaveBeenCalledWith(testKey, testField);
      });
    });
  });

  describe("sorted set operations", () => {
    describe("zadd", () => {
      it("should add member to sorted set", async () => {
        const testKey = "test:zset";
        const testScore = 100;
        const testMember = "member1";
        mockRedis.zadd.mockResolvedValue(1);

        const result = await service.zadd(testKey, testScore, testMember);

        expect(result).toBe(1);
        expect(mockRedis.zadd).toHaveBeenCalledWith(
          testKey,
          testScore,
          testMember,
        );
      });
    });

    describe("zrange", () => {
      it("should get range of members from sorted set", async () => {
        const testKey = "test:zset";
        const start = 0;
        const stop = -1;
        const expectedMembers = ["member1", "member2"];
        mockRedis.zrange.mockResolvedValue(expectedMembers);

        const result = await service.zrange(testKey, start, stop);

        expect(result).toEqual(expectedMembers);
        expect(mockRedis.zrange).toHaveBeenCalledWith(testKey, start, stop);
      });
    });

    describe("zrangebyscore", () => {
      it("should get members by score range", async () => {
        const testKey = "test:zset";
        const min = 0;
        const max = 100;
        const expectedMembers = ["member1", "member2"];
        mockRedis.zrangebyscore.mockResolvedValue(expectedMembers);

        const result = await service.zrangebyscore(testKey, min, max);

        expect(result).toEqual(expectedMembers);
        expect(mockRedis.zrangebyscore).toHaveBeenCalledWith(testKey, min, max);
      });
    });

    describe("zrem", () => {
      it("should remove member from sorted set", async () => {
        const testKey = "test:zset";
        const testMember = "member1";
        mockRedis.zrem.mockResolvedValue(1);

        const result = await service.zrem(testKey, testMember);

        expect(result).toBe(1);
        expect(mockRedis.zrem).toHaveBeenCalledWith(testKey, testMember);
      });
    });
  });

  describe("utility methods", () => {
    describe("generateKey", () => {
      it("should generate key with prefix", () => {
        const type = "user";
        const id = "123";
        const expected = "todo:user:123";

        const result = service.generateKey(type, id);

        expect(result).toBe(expected);
      });

      it("should generate key with multiple parts", () => {
        const type = "user";
        const parts = ["123", "todos", "completed"];
        const expected = "todo:user:123:todos:completed";

        const result = service.generateKey(type, ...parts);

        expect(result).toBe(expected);
      });
    });

    describe("serializeData", () => {
      it("should serialize object to JSON string", () => {
        const testData = { id: "123", name: "test", active: true };
        const expected = JSON.stringify(testData);

        const result = service.serializeData(testData);

        expect(result).toBe(expected);
      });

      it("should handle null values", () => {
        const result = service.serializeData(null);

        expect(result).toBe("null");
      });
    });

    describe("deserializeData", () => {
      it("should deserialize JSON string to object", () => {
        const testData = { id: "123", name: "test", active: true };
        const jsonString = JSON.stringify(testData);

        const result = service.deserializeData(jsonString);

        expect(result).toEqual(testData);
      });

      it("should return null for null input", () => {
        const result = service.deserializeData(null);

        expect(result).toBeNull();
      });

      it("should return null for invalid JSON", () => {
        const result = service.deserializeData("invalid json");

        expect(result).toBeNull();
      });
    });
  });

  describe("cleanup", () => {
    it("should disconnect Redis connection", async () => {
      mockRedis.disconnect.mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(mockRedis.disconnect).toHaveBeenCalled();
    });
  });
});
