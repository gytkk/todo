import { Test, TestingModule } from "@nestjs/testing";
import { UserSettingsRepository } from "./user-settings.repository";
import { UserSettingsEntity } from "./user-settings.entity";
import { RedisService } from "../redis/redis.service";

describe("UserSettingsRepository", () => {
  let repository: UserSettingsRepository;
  let consoleErrorSpy: jest.SpyInstance;

  const mockRedisService = {
    generateKey: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    zadd: jest.fn(),
    zrem: jest.fn(),
  };

  beforeEach(async () => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSettingsRepository,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    repository = module.get<UserSettingsRepository>(UserSettingsRepository);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findByUserId", () => {
    it("사용자 설정이 존재하면 UserSettingsEntity를 반환해야 함", async () => {
      const userId = "user-1";
      const mockData = {
        id: "settings-1",
        userId: "user-1",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        settings: {
          categories: [
            {
              id: "cat-1",
              name: "업무",
              color: "#FF6B6B",
              isDefault: true,
              createdAt: "2023-01-01T00:00:00.000Z",
            },
          ],
          categoryFilter: { "cat-1": true },
          theme: "system" as const,
          language: "ko",
        },
      };

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findByUserId(userId);

      expect(result).toBeInstanceOf(UserSettingsEntity);
      expect(result?.userId).toBe(userId);
      expect(result?.settings.categories).toHaveLength(1);
      expect(mockRedisService.generateKey).toHaveBeenCalledWith(
        "user-settings",
        userId,
      );
      expect(mockRedisService.get).toHaveBeenCalledWith(
        "todo:user-settings:user-1",
      );
    });

    it("사용자 설정이 존재하지 않으면 null을 반환해야 함", async () => {
      const userId = "user-1";

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(null);

      const result = await repository.findByUserId(userId);

      expect(result).toBeNull();
    });

    it("JSON 파싱 오류가 발생하면 null을 반환해야 함", async () => {
      const userId = "user-1";

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue("invalid json");

      const result = await repository.findByUserId(userId);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error parsing user settings from Redis:",
        expect.any(SyntaxError),
      );
    });
  });

  describe("create", () => {
    it("새 사용자 설정을 성공적으로 생성해야 함", async () => {
      const userSettings = UserSettingsEntity.createDefault("user-1");

      mockRedisService.generateKey
        .mockReturnValueOnce("todo:user-settings:user-1")
        .mockReturnValueOnce("todo:user-settings:list");
      mockRedisService.set.mockResolvedValue("OK");
      mockRedisService.zadd.mockResolvedValue(1);

      const result = await repository.create(userSettings);

      expect(result).toBe(userSettings);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "todo:user-settings:user-1",
        expect.any(String),
      );
      expect(mockRedisService.zadd).toHaveBeenCalledWith(
        "todo:user-settings:list",
        expect.any(Number),
        "user-1",
      );
    });
  });

  describe("update", () => {
    it("기존 사용자 설정을 성공적으로 업데이트해야 함", async () => {
      const userId = "user-1";
      const userSettings = UserSettingsEntity.createDefault(userId);
      const mockExistingData = {
        id: "settings-1",
        userId: "user-1",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        settings: {
          categories: [],
          categoryFilter: {},
          theme: "system" as const,
          language: "ko",
        },
      };

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockExistingData));
      mockRedisService.set.mockResolvedValue("OK");

      const result = await repository.update(userId, userSettings);

      expect(result).toBe(userSettings);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "todo:user-settings:user-1",
        expect.any(String),
      );
    });

    it("존재하지 않는 사용자 설정을 업데이트하면 null을 반환해야 함", async () => {
      const userId = "user-1";
      const userSettings = UserSettingsEntity.createDefault(userId);

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(null);

      const result = await repository.update(userId, userSettings);

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("사용자 설정을 성공적으로 삭제해야 함", async () => {
      const userId = "user-1";

      mockRedisService.generateKey
        .mockReturnValueOnce("todo:user-settings:user-1")
        .mockReturnValueOnce("todo:user-settings:list");
      mockRedisService.del.mockResolvedValue(1);
      mockRedisService.zrem.mockResolvedValue(1);

      const result = await repository.delete(userId);

      expect(result).toBe(true);
      expect(mockRedisService.del).toHaveBeenCalledWith(
        "todo:user-settings:user-1",
      );
      expect(mockRedisService.zrem).toHaveBeenCalledWith(
        "todo:user-settings:list",
        userId,
      );
    });

    it("존재하지 않는 사용자 설정을 삭제하면 false를 반환해야 함", async () => {
      const userId = "user-1";

      mockRedisService.generateKey
        .mockReturnValueOnce("todo:user-settings:user-1")
        .mockReturnValueOnce("todo:user-settings:list");
      mockRedisService.del.mockResolvedValue(0);
      mockRedisService.zrem.mockResolvedValue(1);

      const result = await repository.delete(userId);

      expect(result).toBe(false);
    });
  });

  describe("findOrCreate", () => {
    it("존재하는 사용자 설정을 반환해야 함", async () => {
      const userId = "user-1";
      const mockData = {
        id: "settings-1",
        userId: "user-1",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        settings: {
          categories: [],
          categoryFilter: {},
          theme: "system" as const,
          language: "ko",
        },
      };

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findOrCreate(userId);

      expect(result).toBeInstanceOf(UserSettingsEntity);
      expect(result.userId).toBe(userId);
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it("존재하지 않는 사용자 설정을 생성해야 함", async () => {
      const userId = "user-1";

      mockRedisService.generateKey
        .mockReturnValueOnce("todo:user-settings:user-1")
        .mockReturnValueOnce("todo:user-settings:user-1")
        .mockReturnValueOnce("todo:user-settings:list");
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue("OK");
      mockRedisService.zadd.mockResolvedValue(1);

      const result = await repository.findOrCreate(userId);

      expect(result).toBeInstanceOf(UserSettingsEntity);
      expect(result.userId).toBe(userId);
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockRedisService.zadd).toHaveBeenCalled();
    });
  });
});
