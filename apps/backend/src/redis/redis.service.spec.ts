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
  hkeys: jest.fn(),
  hvals: jest.fn(),
  hlen: jest.fn(),
  hexists: jest.fn(),
  zadd: jest.fn(),
  zrem: jest.fn(),
  zrange: jest.fn(),
  zrangebyscore: jest.fn(),
  zrevrange: jest.fn(),
  zcard: jest.fn(),
  zscore: jest.fn(),
  zcount: jest.fn(),
  sadd: jest.fn(),
  srem: jest.fn(),
  smembers: jest.fn(),
  sismember: jest.fn(),
  scard: jest.fn(),
  lpush: jest.fn(),
  rpush: jest.fn(),
  lpop: jest.fn(),
  rpop: jest.fn(),
  lrange: jest.fn(),
  llen: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  flushdb: jest.fn(),
  flushall: jest.fn(),
  info: jest.fn(),
  dbsize: jest.fn(),
  keys: jest.fn(),
  scan: jest.fn(),
  eval: jest.fn(),
  pipeline: jest.fn(() => ({
    exec: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    hgetall: jest.fn(),
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

  describe("expire and ttl operations", () => {
    describe("expire", () => {
      it("should set TTL for key", async () => {
        const testKey = "test:key";
        const ttl = 3600;
        mockRedis.expire.mockResolvedValue(1);

        const result = await service.expire(testKey, ttl);

        expect(result).toBe(1);
        expect(mockRedis.expire).toHaveBeenCalledWith(testKey, ttl);
      });
    });

    describe("ttl", () => {
      it("should get TTL for key", async () => {
        const testKey = "test:key";
        const expectedTtl = 3600;
        mockRedis.ttl.mockResolvedValue(expectedTtl);

        const result = await service.ttl(testKey);

        expect(result).toBe(expectedTtl);
        expect(mockRedis.ttl).toHaveBeenCalledWith(testKey);
      });
    });
  });

  describe("additional hash operations", () => {
    describe("hkeys", () => {
      it("should get all hash field names", async () => {
        const testKey = "test:hash";
        const expectedKeys = ["field1", "field2"];
        mockRedis.hkeys.mockResolvedValue(expectedKeys);

        const result = await service.hkeys(testKey);

        expect(result).toEqual(expectedKeys);
        expect(mockRedis.hkeys).toHaveBeenCalledWith(testKey);
      });
    });

    describe("hvals", () => {
      it("should get all hash field values", async () => {
        const testKey = "test:hash";
        const expectedValues = ["value1", "value2"];
        mockRedis.hvals.mockResolvedValue(expectedValues);

        const result = await service.hvals(testKey);

        expect(result).toEqual(expectedValues);
        expect(mockRedis.hvals).toHaveBeenCalledWith(testKey);
      });
    });

    describe("hlen", () => {
      it("should get hash field count", async () => {
        const testKey = "test:hash";
        const expectedCount = 5;
        mockRedis.hlen.mockResolvedValue(expectedCount);

        const result = await service.hlen(testKey);

        expect(result).toBe(expectedCount);
        expect(mockRedis.hlen).toHaveBeenCalledWith(testKey);
      });
    });

    describe("hexists", () => {
      it("should return true for existing hash field", async () => {
        const testKey = "test:hash";
        const testField = "field1";
        mockRedis.hexists.mockResolvedValue(1);

        const result = await service.hexists(testKey, testField);

        expect(result).toBe(true);
        expect(mockRedis.hexists).toHaveBeenCalledWith(testKey, testField);
      });

      it("should return false for non-existent hash field", async () => {
        const testKey = "test:hash";
        const testField = "nonexistent";
        mockRedis.hexists.mockResolvedValue(0);

        const result = await service.hexists(testKey, testField);

        expect(result).toBe(false);
        expect(mockRedis.hexists).toHaveBeenCalledWith(testKey, testField);
      });
    });
  });

  describe("additional sorted set operations", () => {
    describe("zrevrange", () => {
      it("should get range of members in reverse order", async () => {
        const testKey = "test:zset";
        const start = 0;
        const stop = -1;
        const expectedMembers = ["member2", "member1"];
        mockRedis.zrevrange.mockResolvedValue(expectedMembers);

        const result = await service.zrevrange(testKey, start, stop);

        expect(result).toEqual(expectedMembers);
        expect(mockRedis.zrevrange).toHaveBeenCalledWith(testKey, start, stop);
      });
    });

    describe("zcard", () => {
      it("should get sorted set cardinality", async () => {
        const testKey = "test:zset";
        const expectedCount = 10;
        mockRedis.zcard.mockResolvedValue(expectedCount);

        const result = await service.zcard(testKey);

        expect(result).toBe(expectedCount);
        expect(mockRedis.zcard).toHaveBeenCalledWith(testKey);
      });
    });

    describe("zscore", () => {
      it("should get member score", async () => {
        const testKey = "test:zset";
        const testMember = "member1";
        const expectedScore = "100";
        mockRedis.zscore.mockResolvedValue(expectedScore);

        const result = await service.zscore(testKey, testMember);

        expect(result).toBe(expectedScore);
        expect(mockRedis.zscore).toHaveBeenCalledWith(testKey, testMember);
      });
    });

    describe("zcount", () => {
      it("should count members in score range", async () => {
        const testKey = "test:zset";
        const min = 0;
        const max = 100;
        const expectedCount = 5;
        mockRedis.zcount.mockResolvedValue(expectedCount);

        const result = await service.zcount(testKey, min, max);

        expect(result).toBe(expectedCount);
        expect(mockRedis.zcount).toHaveBeenCalledWith(testKey, min, max);
      });
    });
  });

  describe("set operations", () => {
    describe("sadd", () => {
      it("should add member to set", async () => {
        const testKey = "test:set";
        const testMember = "member1";
        mockRedis.sadd.mockResolvedValue(1);

        const result = await service.sadd(testKey, testMember);

        expect(result).toBe(1);
        expect(mockRedis.sadd).toHaveBeenCalledWith(testKey, testMember);
      });
    });

    describe("srem", () => {
      it("should remove member from set", async () => {
        const testKey = "test:set";
        const testMember = "member1";
        mockRedis.srem.mockResolvedValue(1);

        const result = await service.srem(testKey, testMember);

        expect(result).toBe(1);
        expect(mockRedis.srem).toHaveBeenCalledWith(testKey, testMember);
      });
    });

    describe("smembers", () => {
      it("should get all set members", async () => {
        const testKey = "test:set";
        const expectedMembers = ["member1", "member2"];
        mockRedis.smembers.mockResolvedValue(expectedMembers);

        const result = await service.smembers(testKey);

        expect(result).toEqual(expectedMembers);
        expect(mockRedis.smembers).toHaveBeenCalledWith(testKey);
      });
    });

    describe("sismember", () => {
      it("should return true for existing set member", async () => {
        const testKey = "test:set";
        const testMember = "member1";
        mockRedis.sismember.mockResolvedValue(1);

        const result = await service.sismember(testKey, testMember);

        expect(result).toBe(true);
        expect(mockRedis.sismember).toHaveBeenCalledWith(testKey, testMember);
      });

      it("should return false for non-existent set member", async () => {
        const testKey = "test:set";
        const testMember = "nonexistent";
        mockRedis.sismember.mockResolvedValue(0);

        const result = await service.sismember(testKey, testMember);

        expect(result).toBe(false);
        expect(mockRedis.sismember).toHaveBeenCalledWith(testKey, testMember);
      });
    });

    describe("scard", () => {
      it("should get set cardinality", async () => {
        const testKey = "test:set";
        const expectedCount = 5;
        mockRedis.scard.mockResolvedValue(expectedCount);

        const result = await service.scard(testKey);

        expect(result).toBe(expectedCount);
        expect(mockRedis.scard).toHaveBeenCalledWith(testKey);
      });
    });
  });

  describe("list operations", () => {
    describe("lpush", () => {
      it("should push value to left of list", async () => {
        const testKey = "test:list";
        const testValue = "value1";
        mockRedis.lpush.mockResolvedValue(1);

        const result = await service.lpush(testKey, testValue);

        expect(result).toBe(1);
        expect(mockRedis.lpush).toHaveBeenCalledWith(testKey, testValue);
      });
    });

    describe("rpush", () => {
      it("should push value to right of list", async () => {
        const testKey = "test:list";
        const testValue = "value1";
        mockRedis.rpush.mockResolvedValue(1);

        const result = await service.rpush(testKey, testValue);

        expect(result).toBe(1);
        expect(mockRedis.rpush).toHaveBeenCalledWith(testKey, testValue);
      });
    });

    describe("lpop", () => {
      it("should pop value from left of list", async () => {
        const testKey = "test:list";
        const expectedValue = "value1";
        mockRedis.lpop.mockResolvedValue(expectedValue);

        const result = await service.lpop(testKey);

        expect(result).toBe(expectedValue);
        expect(mockRedis.lpop).toHaveBeenCalledWith(testKey);
      });
    });

    describe("rpop", () => {
      it("should pop value from right of list", async () => {
        const testKey = "test:list";
        const expectedValue = "value1";
        mockRedis.rpop.mockResolvedValue(expectedValue);

        const result = await service.rpop(testKey);

        expect(result).toBe(expectedValue);
        expect(mockRedis.rpop).toHaveBeenCalledWith(testKey);
      });
    });

    describe("lrange", () => {
      it("should get range of list values", async () => {
        const testKey = "test:list";
        const start = 0;
        const stop = -1;
        const expectedValues = ["value1", "value2"];
        mockRedis.lrange.mockResolvedValue(expectedValues);

        const result = await service.lrange(testKey, start, stop);

        expect(result).toEqual(expectedValues);
        expect(mockRedis.lrange).toHaveBeenCalledWith(testKey, start, stop);
      });
    });

    describe("llen", () => {
      it("should get list length", async () => {
        const testKey = "test:list";
        const expectedLength = 5;
        mockRedis.llen.mockResolvedValue(expectedLength);

        const result = await service.llen(testKey);

        expect(result).toBe(expectedLength);
        expect(mockRedis.llen).toHaveBeenCalledWith(testKey);
      });
    });
  });

  describe("scan operations", () => {
    describe("keys", () => {
      it("should get keys matching pattern", async () => {
        const pattern = "test:*";
        const expectedKeys = ["test:key1", "test:key2"];
        mockRedis.keys.mockResolvedValue(expectedKeys);

        const result = await service.keys(pattern);

        expect(result).toEqual(expectedKeys);
        expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
      });
    });

    describe("scan", () => {
      it("should scan keys with default parameters", async () => {
        const cursor = 0;
        const expectedResult: [string, string[]] = ["0", ["key1", "key2"]];
        mockRedis.scan.mockResolvedValue(expectedResult);

        const result = await service.scan(cursor);

        expect(result).toEqual(expectedResult);
        expect(mockRedis.scan).toHaveBeenCalledWith(cursor);
      });

      it("should scan keys with pattern", async () => {
        const cursor = 0;
        const pattern = "test:*";
        const expectedResult: [string, string[]] = ["0", ["test:key1"]];
        mockRedis.scan.mockResolvedValue(expectedResult);

        const result = await service.scan(cursor, pattern);

        expect(result).toEqual(expectedResult);
        expect(mockRedis.scan).toHaveBeenCalledWith(cursor, "MATCH", pattern);
      });

      it("should scan keys with count", async () => {
        const cursor = 0;
        const count = 100;
        const expectedResult: [string, string[]] = ["0", ["key1", "key2"]];
        mockRedis.scan.mockResolvedValue(expectedResult);

        const result = await service.scan(cursor, undefined, count);

        expect(result).toEqual(expectedResult);
        expect(mockRedis.scan).toHaveBeenCalledWith(cursor, "COUNT", count);
      });

      it("should scan keys with pattern and count", async () => {
        const cursor = 0;
        const pattern = "test:*";
        const count = 100;
        const expectedResult: [string, string[]] = ["0", ["test:key1"]];
        mockRedis.scan.mockResolvedValue(expectedResult);

        const result = await service.scan(cursor, pattern, count);

        expect(result).toEqual(expectedResult);
        expect(mockRedis.scan).toHaveBeenCalledWith(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          count,
        );
      });
    });
  });

  describe("transaction operations", () => {
    describe("pipeline", () => {
      it("should return pipeline instance", () => {
        const mockPipeline = {
          exec: jest.fn(),
          set: jest.fn(),
          get: jest.fn(),
          hgetall: jest.fn(),
        };
        mockRedis.pipeline.mockReturnValue(mockPipeline);

        const result = service.pipeline();

        expect(result).toBe(mockPipeline);
        expect(mockRedis.pipeline).toHaveBeenCalled();
      });
    });

    describe("multi", () => {
      it("should return multi instance", () => {
        const mockMulti = { exec: jest.fn() };
        mockRedis.multi.mockReturnValue(mockMulti);

        const result = service.multi();

        expect(result).toBe(mockMulti);
        expect(mockRedis.multi).toHaveBeenCalled();
      });
    });
  });

  describe("database operations", () => {
    describe("flushdb", () => {
      it("should flush current database", async () => {
        mockRedis.flushdb.mockResolvedValue("OK");

        const result = await service.flushdb();

        expect(result).toBe("OK");
        expect(mockRedis.flushdb).toHaveBeenCalled();
      });
    });

    describe("flushall", () => {
      it("should flush all databases", async () => {
        mockRedis.flushall.mockResolvedValue("OK");

        const result = await service.flushall();

        expect(result).toBe("OK");
        expect(mockRedis.flushall).toHaveBeenCalled();
      });
    });

    describe("info", () => {
      it("should get Redis info", async () => {
        const expectedInfo = "redis_version:6.2.0";
        mockRedis.info.mockResolvedValue(expectedInfo);

        const result = await service.info();

        expect(result).toBe(expectedInfo);
        expect(mockRedis.info).toHaveBeenCalled();
      });

      it("should get Redis info for specific section", async () => {
        const section = "memory";
        const expectedInfo = "used_memory:1024";
        mockRedis.info.mockResolvedValue(expectedInfo);

        const result = await service.info(section);

        expect(result).toBe(expectedInfo);
        expect(mockRedis.info).toHaveBeenCalledWith(section);
      });
    });

    describe("dbsize", () => {
      it("should get database size", async () => {
        const expectedSize = 42;
        mockRedis.dbsize.mockResolvedValue(expectedSize);

        const result = await service.dbsize();

        expect(result).toBe(expectedSize);
        expect(mockRedis.dbsize).toHaveBeenCalled();
      });
    });
  });

  describe("connection status", () => {
    describe("status", () => {
      it("should return Redis connection status", () => {
        const result = service.status;

        expect(result).toBe("ready");
      });
    });

    describe("isConnected", () => {
      it("should return true when Redis is ready", () => {
        const result = service.isConnected;

        expect(result).toBe(true);
      });

      it("should return false when Redis is not ready", () => {
        mockRedis.status = "connecting";

        const result = service.isConnected;

        expect(result).toBe(false);
      });
    });
  });

  describe("advanced operations", () => {
    describe("batch", () => {
      it("should execute batch operations", async () => {
        const operations = [
          { command: "set", args: ["key1", "value1"] },
          { command: "get", args: ["key1"] },
        ];
        const mockPipeline = {
          set: jest.fn(),
          get: jest.fn(),
          hgetall: jest.fn(),
          exec: jest.fn().mockResolvedValue([
            [null, "OK"],
            [null, "value1"],
          ]),
        };
        mockRedis.pipeline.mockReturnValue(mockPipeline);

        const result = await service.batch(operations);

        expect(result).toEqual(["OK", "value1"]);
        expect(mockPipeline.set).toHaveBeenCalledWith("key1", "value1");
        expect(mockPipeline.get).toHaveBeenCalledWith("key1");
        expect(mockPipeline.exec).toHaveBeenCalled();
      });

      it("should handle empty results", async () => {
        const operations = [{ command: "set", args: ["key1", "value1"] }];
        const mockPipeline = {
          set: jest.fn(),
          get: jest.fn(),
          hgetall: jest.fn(),
          exec: jest.fn().mockResolvedValue(null),
        };
        mockRedis.pipeline.mockReturnValue(mockPipeline);

        const result = await service.batch(operations);

        expect(result).toEqual([]);
      });
    });

    describe("lock", () => {
      it("should acquire lock successfully", async () => {
        const key = "lock:key";
        const value = "lock-value";
        const ttl = 10;
        mockRedis.set.mockResolvedValue("OK");

        const result = await service.lock(key, value, ttl);

        expect(result).toBe(true);
        expect(mockRedis.set).toHaveBeenCalledWith(
          key,
          value,
          "PX",
          ttl * 1000,
          "NX",
        );
      });

      it("should fail to acquire lock", async () => {
        const key = "lock:key";
        const value = "lock-value";
        const ttl = 10;
        mockRedis.set.mockResolvedValue(null);

        const result = await service.lock(key, value, ttl);

        expect(result).toBe(false);
        expect(mockRedis.set).toHaveBeenCalledWith(
          key,
          value,
          "PX",
          ttl * 1000,
          "NX",
        );
      });
    });

    describe("unlock", () => {
      it("should unlock successfully", async () => {
        const key = "lock:key";
        const value = "lock-value";
        mockRedis.eval.mockResolvedValue(1);

        const result = await service.unlock(key, value);

        expect(result).toBe(true);
        expect(mockRedis.eval).toHaveBeenCalledWith(
          expect.stringContaining("redis.call"),
          1,
          key,
          value,
        );
      });

      it("should fail to unlock", async () => {
        const key = "lock:key";
        const value = "wrong-value";
        mockRedis.eval.mockResolvedValue(0);

        const result = await service.unlock(key, value);

        expect(result).toBe(false);
        expect(mockRedis.eval).toHaveBeenCalledWith(
          expect.stringContaining("redis.call"),
          1,
          key,
          value,
        );
      });
    });
  });

  describe("cleanup", () => {
    it("should disconnect Redis connection", () => {
      mockRedis.disconnect.mockResolvedValue(undefined);

      service.onModuleDestroy();

      expect(mockRedis.disconnect).toHaveBeenCalled();
    });
  });
});
