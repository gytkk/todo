import { Test, TestingModule } from "@nestjs/testing";
import { UserRepository } from "./user.repository";
import { RedisService } from "../redis/redis.service";
import { User } from "./user.entity";

describe("UserRepository (Redis)", () => {
  let repository: UserRepository;
  let mockRedisService: jest.Mocked<RedisService>;

  // Spy function references
  let generateKeySpy: jest.SpyInstance;
  let hgetallSpy: jest.SpyInstance;
  let hmsetSpy: jest.SpyInstance;
  let delSpy: jest.SpyInstance;
  let _zaddSpy: jest.SpyInstance;
  let _zremSpy: jest.SpyInstance;
  let existsSpy: jest.SpyInstance;
  let getSpy: jest.SpyInstance;
  let _setSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockPipeline = {
      hmset: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      zrem: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      hgetall: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1], // del 명령어는 삭제된 키 수를 반환
        [null, 1], // zrem 명령어는 제거된 요소 수를 반환
        [null, 1], // del 명령어 (email key)
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
      pipeline: jest.fn(() => mockPipeline),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: RedisService,
          useValue: mockRedis,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    mockRedisService = module.get<RedisService>(
      RedisService,
    ) as jest.Mocked<RedisService>;

    // Create spies for RedisService methods
    generateKeySpy = jest.spyOn(mockRedisService, "generateKey");
    hgetallSpy = jest.spyOn(mockRedisService, "hgetall");
    hmsetSpy = jest.spyOn(mockRedisService, "hmset");
    delSpy = jest.spyOn(mockRedisService, "del");
    _zaddSpy = jest.spyOn(mockRedisService, "zadd");
    _zremSpy = jest.spyOn(mockRedisService, "zrem");
    existsSpy = jest.spyOn(mockRedisService, "exists");
    getSpy = jest.spyOn(mockRedisService, "get");
    _setSpy = jest.spyOn(mockRedisService, "set");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      const userId = "user-123";

      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue({
        id: userId,
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashedPassword",
        emailVerified: "true",
        isActive: "true",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      });

      const result = await repository.findById(userId);

      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe(userId);
      expect(result?.email).toBe("test@example.com");
      expect(result?.name).toBe("Test User");
      expect(result?.emailVerified).toBe(true);
      expect(result?.isActive).toBe(true);
      expect(generateKeySpy).toHaveBeenCalledWith("user", userId);
      expect(hgetallSpy).toHaveBeenCalledWith(`todo:user:${userId}`);
    });

    it("should return null for non-existent user", async () => {
      const userId = "nonexistent-user";
      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue({});

      const result = await repository.findById(userId);

      expect(result).toBeNull();
      expect(generateKeySpy).toHaveBeenCalledWith("user", userId);
      expect(hgetallSpy).toHaveBeenCalledWith(`todo:user:${userId}`);
    });
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      const email = "test@example.com";
      const userId = "user-123";
      const userData = {
        id: userId,
        email: email,
        name: "Test User",
        passwordHash: "hashedPassword",
        emailVerified: "true",
        isActive: "true",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:user:email:${email}`,
      );
      mockRedisService.get.mockResolvedValue(userId);
      mockRedisService.generateKey.mockReturnValueOnce(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue(userData);

      const result = await repository.findByEmail(email);

      expect(result).toBeInstanceOf(User);
      expect(result?.email).toBe(email);
      expect(result?.id).toBe(userId);
      expect(generateKeySpy).toHaveBeenCalledWith("user", "email", email);
      expect(getSpy).toHaveBeenCalledWith(`todo:user:email:${email}`);
      expect(generateKeySpy).toHaveBeenCalledWith("user", userId);
      expect(hgetallSpy).toHaveBeenCalledWith(`todo:user:${userId}`);
    });

    it("should return null for non-existent email", async () => {
      const email = "nonexistent@example.com";
      mockRedisService.generateKey.mockReturnValue(`todo:user:email:${email}`);
      mockRedisService.get.mockResolvedValue(null);

      const result = await repository.findByEmail(email);

      expect(result).toBeNull();
      expect(generateKeySpy).toHaveBeenCalledWith("user", "email", email);
      expect(getSpy).toHaveBeenCalledWith(`todo:user:email:${email}`);
    });
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const userData = {
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashedPassword",
      };

      mockRedisService.generateKey.mockReturnValue("mocked-key");
      mockRedisService.hmset.mockResolvedValue("OK");
      mockRedisService.set.mockResolvedValue("OK");
      mockRedisService.zadd.mockResolvedValue(1);

      const result = await repository.create(userData);

      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(result.passwordHash).toBe(userData.passwordHash);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.emailVerified).toBe(false);
      expect(result.isActive).toBe(true);

      // Pipeline이 올바르게 호출되었는지 확인
      expect(mockRedisService.pipeline).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update existing user", async () => {
      const userId = "user-123";
      const existingData = {
        id: userId,
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashedPassword",
        emailVerified: "true",
        isActive: "true",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      const updateData = {
        name: "Updated User",
        profileImage: "https://example.com/image.jpg",
      };

      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue(existingData);
      mockRedisService.hmset.mockResolvedValue("OK");

      const result = await repository.update(userId, updateData);

      expect(result).toBeInstanceOf(User);
      expect(result?.name).toBe(updateData.name);
      expect(result?.profileImage).toBe(updateData.profileImage);
      expect(result?.updatedAt).not.toEqual(new Date(existingData.updatedAt));

      // Pipeline이 올바르게 호출되었는지 확인
      expect(mockRedisService.pipeline).toHaveBeenCalled();
    });

    it("should return null for non-existent user", async () => {
      const userId = "nonexistent-user";
      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue({});

      const result = await repository.update(userId, { name: "Updated" });

      expect(result).toBeNull();
      expect(hmsetSpy).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete existing user", async () => {
      const userId = "user-123";
      const email = "test@example.com";
      const userData = {
        id: userId,
        email: email,
        name: "Test User",
        passwordHash: "hashedPassword",
        emailVerified: "true",
        isActive: "true",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      mockRedisService.generateKey.mockReturnValueOnce(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue(userData);
      mockRedisService.generateKey.mockReturnValueOnce(`todo:user:${userId}`);
      mockRedisService.generateKey.mockReturnValueOnce(
        `todo:user:email:${email}`,
      );
      mockRedisService.generateKey.mockReturnValueOnce("todo:user:list");
      mockRedisService.del.mockResolvedValue(1);
      mockRedisService.zrem.mockResolvedValue(1);

      const result = await repository.delete(userId);

      expect(result).toBe(true);
      // Pipeline이 올바르게 호출되었는지 확인
      expect(mockRedisService.pipeline).toHaveBeenCalled();
    });

    it("should return false for non-existent user", async () => {
      const userId = "nonexistent-user";
      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue({});

      const result = await repository.delete(userId);

      expect(result).toBe(false);
      expect(delSpy).not.toHaveBeenCalled();
    });
  });

  describe("existsByEmail", () => {
    it("should return true for existing email", async () => {
      const email = "test@example.com";
      mockRedisService.generateKey.mockReturnValue(`todo:user:email:${email}`);
      mockRedisService.exists.mockResolvedValue(true);

      const result = await repository.existsByEmail(email);

      expect(result).toBe(true);
      expect(generateKeySpy).toHaveBeenCalledWith("user", "email", email);
      expect(existsSpy).toHaveBeenCalledWith(`todo:user:email:${email}`);
    });

    it("should return false for non-existent email", async () => {
      const email = "nonexistent@example.com";
      mockRedisService.generateKey.mockReturnValue(`todo:user:email:${email}`);
      mockRedisService.exists.mockResolvedValue(false);

      const result = await repository.existsByEmail(email);

      expect(result).toBe(false);
      expect(generateKeySpy).toHaveBeenCalledWith("user", "email", email);
      expect(existsSpy).toHaveBeenCalledWith(`todo:user:email:${email}`);
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      const userIds = ["user-1", "user-2"];
      const userData1 = {
        id: "user-1",
        email: "user1@example.com",
        name: "User 1",
        passwordHash: "hash1",
        emailVerified: "true",
        isActive: "true",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };
      const userData2 = {
        id: "user-2",
        email: "user2@example.com",
        name: "User 2",
        passwordHash: "hash2",
        emailVerified: "false",
        isActive: "true",
        createdAt: "2023-01-02T00:00:00.000Z",
        updatedAt: "2023-01-02T00:00:00.000Z",
      };

      mockRedisService.generateKey.mockReturnValueOnce("todo:user:list");
      mockRedisService.zrange.mockResolvedValue(userIds);

      // Pipeline exec이 두 개의 hgetall 결과를 반환하도록 설정
      const mockPipelineForFindAll = {
        hgetall: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, userData1],
          [null, userData2],
        ]),
      };
      mockRedisService.pipeline.mockReturnValueOnce(
        mockPipelineForFindAll as any,
      );

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(User);
      expect(result[1]).toBeInstanceOf(User);
      expect(result[0].id).toBe("user-1");
      expect(result[1].id).toBe("user-2");
    });

    it("should return empty array when no users exist", async () => {
      mockRedisService.generateKey.mockReturnValue("todo:user:list");
      mockRedisService.zrange.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });
});
