import { Test, TestingModule } from "@nestjs/testing";
import { UserRepository } from "./user.repository";
import { RedisService } from "../redis/redis.service";
import { User } from "./user.entity";

describe("UserRepository (Redis)", () => {
  let repository: UserRepository;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
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
      zrangebyscore: jest.fn(),
      zrevrange: jest.fn(),
      zcard: jest.fn(),
      zscore: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      const userId = "user-123";
      const _userData = {
        id: userId,
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashedPassword",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };

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
      expect(mockRedisService.generateKey).toHaveBeenCalledWith("user", userId);
      expect(mockRedisService.hgetall).toHaveBeenCalledWith(
        `todo:user:${userId}`,
      );
    });

    it("should return null for non-existent user", async () => {
      const userId = "nonexistent-user";
      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue({});

      const result = await repository.findById(userId);

      expect(result).toBeNull();
      expect(mockRedisService.generateKey).toHaveBeenCalledWith("user", userId);
      expect(mockRedisService.hgetall).toHaveBeenCalledWith(
        `todo:user:${userId}`,
      );
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
      expect(mockRedisService.generateKey).toHaveBeenCalledWith(
        "user",
        "email",
        email,
      );
      expect(mockRedisService.get).toHaveBeenCalledWith(
        `todo:user:email:${email}`,
      );
      expect(mockRedisService.generateKey).toHaveBeenCalledWith("user", userId);
      expect(mockRedisService.hgetall).toHaveBeenCalledWith(
        `todo:user:${userId}`,
      );
    });

    it("should return null for non-existent email", async () => {
      const email = "nonexistent@example.com";
      mockRedisService.generateKey.mockReturnValue(`todo:user:email:${email}`);
      mockRedisService.get.mockResolvedValue(null);

      const result = await repository.findByEmail(email);

      expect(result).toBeNull();
      expect(mockRedisService.generateKey).toHaveBeenCalledWith(
        "user",
        "email",
        email,
      );
      expect(mockRedisService.get).toHaveBeenCalledWith(
        `todo:user:email:${email}`,
      );
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

      expect(mockRedisService.hmset).toHaveBeenCalledWith(
        "mocked-key",
        expect.objectContaining({
          id: result.id,
          email: userData.email,
          name: userData.name,
          passwordHash: userData.passwordHash,
          emailVerified: "false",
          isActive: "true",
          profileImage: "",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "mocked-key",
        result.id,
      );
      expect(mockRedisService.zadd).toHaveBeenCalledWith(
        "mocked-key",
        expect.any(Number),
        result.id,
      );
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

      expect(mockRedisService.hmset).toHaveBeenCalledWith(
        `todo:user:${userId}`,
        expect.objectContaining({
          name: updateData.name,
          profileImage: updateData.profileImage,
        }),
      );
    });

    it("should return null for non-existent user", async () => {
      const userId = "nonexistent-user";
      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue({});

      const result = await repository.update(userId, { name: "Updated" });

      expect(result).toBeNull();
      expect(mockRedisService.hmset).not.toHaveBeenCalled();
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
      expect(mockRedisService.del).toHaveBeenCalledWith(`todo:user:${userId}`);
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `todo:user:email:${email}`,
      );
      expect(mockRedisService.zrem).toHaveBeenCalledWith(
        "todo:user:list",
        userId,
      );
    });

    it("should return false for non-existent user", async () => {
      const userId = "nonexistent-user";
      mockRedisService.generateKey.mockReturnValue(`todo:user:${userId}`);
      mockRedisService.hgetall.mockResolvedValue({});

      const result = await repository.delete(userId);

      expect(result).toBe(false);
      expect(mockRedisService.del).not.toHaveBeenCalled();
    });
  });

  describe("exists", () => {
    it("should return true for existing email", async () => {
      const email = "test@example.com";
      mockRedisService.generateKey.mockReturnValue(`todo:user:email:${email}`);
      mockRedisService.exists.mockResolvedValue(true);

      const result = await repository.exists(email);

      expect(result).toBe(true);
      expect(mockRedisService.generateKey).toHaveBeenCalledWith(
        "user",
        "email",
        email,
      );
      expect(mockRedisService.exists).toHaveBeenCalledWith(
        `todo:user:email:${email}`,
      );
    });

    it("should return false for non-existent email", async () => {
      const email = "nonexistent@example.com";
      mockRedisService.generateKey.mockReturnValue(`todo:user:email:${email}`);
      mockRedisService.exists.mockResolvedValue(false);

      const result = await repository.exists(email);

      expect(result).toBe(false);
      expect(mockRedisService.generateKey).toHaveBeenCalledWith(
        "user",
        "email",
        email,
      );
      expect(mockRedisService.exists).toHaveBeenCalledWith(
        `todo:user:email:${email}`,
      );
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
      mockRedisService.generateKey.mockReturnValueOnce("todo:user:user-1");
      mockRedisService.generateKey.mockReturnValueOnce("todo:user:user-2");
      mockRedisService.hgetall.mockResolvedValueOnce(userData1);
      mockRedisService.hgetall.mockResolvedValueOnce(userData2);

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
