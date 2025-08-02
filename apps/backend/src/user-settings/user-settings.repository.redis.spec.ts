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

  describe("레거시 데이터 호환성", () => {
    it("확장 필드가 없는 레거시 데이터를 올바르게 파싱해야 함", async () => {
      const userId = "user-1";
      const legacyData = {
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
              isDefault: true, // 레거시 필드
              createdAt: "2023-01-01T00:00:00.000Z",
              // order 필드 없음
            },
          ],
          categoryFilter: { "cat-1": true },
          theme: "light" as const,
          language: "ko",
          // 새로 추가된 필드들 없음
        },
      };

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(JSON.stringify(legacyData));

      const result = await repository.findByUserId(userId);

      expect(result).toBeInstanceOf(UserSettingsEntity);
      expect(result?.userId).toBe(userId);

      // 기존 필드는 유지
      expect(result?.settings.theme).toBe("light");
      expect(result?.settings.language).toBe("ko");
      expect(result?.settings.categories).toHaveLength(1);

      // 새로 추가된 필드들이 기본값으로 설정되어야 함
      expect(result?.settings.autoMoveTodos).toBe(true);
      expect(result?.settings.showTaskMoveNotifications).toBe(true);
      expect(result?.settings.completedTodoDisplay).toBe("yesterday");
      expect(result?.settings.dateFormat).toBe("YYYY-MM-DD");
      expect(result?.settings.timeFormat).toBe("24h");
      expect(result?.settings.weekStart).toBe("monday");
      expect(result?.settings.notifications).toEqual({
        enabled: true,
        dailyReminder: false,
        weeklyReport: false,
      });
      expect(result?.settings.autoBackup).toBe(false);
      expect(result?.settings.backupInterval).toBe("weekly");
    });

    it("부분적으로 누락된 필드가 있는 데이터를 올바르게 파싱해야 함", async () => {
      const userId = "user-1";
      const partialData = {
        id: "settings-1",
        userId: "user-1",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        settings: {
          categories: [
            {
              id: "cat-1",
              name: "개인",
              color: "#3b82f6",
              createdAt: "2023-01-01T00:00:00.000Z",
              order: 0,
            },
          ],
          categoryFilter: { "cat-1": true },
          theme: "dark" as const,
          language: "en",
          // 일부 새 필드만 포함
          autoMoveTodos: false,
          dateFormat: "MM/DD/YYYY" as const,
          notifications: {
            enabled: false,
            // dailyReminder, weeklyReport 누락
          },
          // 나머지 필드들은 누락
        },
      };

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(JSON.stringify(partialData));

      const result = await repository.findByUserId(userId);

      expect(result).toBeInstanceOf(UserSettingsEntity);

      // 제공된 필드는 유지
      expect(result?.settings.theme).toBe("dark");
      expect(result?.settings.language).toBe("en");
      expect(result?.settings.autoMoveTodos).toBe(false);
      expect(result?.settings.dateFormat).toBe("MM/DD/YYYY");
      expect(result?.settings.notifications.enabled).toBe(false);

      // 누락된 필드들은 기본값으로 설정
      expect(result?.settings.showTaskMoveNotifications).toBe(true);
      expect(result?.settings.completedTodoDisplay).toBe("yesterday");
      expect(result?.settings.timeFormat).toBe("24h");
      expect(result?.settings.weekStart).toBe("monday");
      expect(result?.settings.notifications.dailyReminder).toBe(false);
      expect(result?.settings.notifications.weeklyReport).toBe(false);
      expect(result?.settings.autoBackup).toBe(false);
      expect(result?.settings.backupInterval).toBe("weekly");
    });

    it("notifications 객체가 누락된 경우 기본값으로 설정되어야 함", async () => {
      const userId = "user-1";
      const dataWithoutNotifications = {
        id: "settings-1",
        userId: "user-1",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        settings: {
          categories: [],
          categoryFilter: {},
          theme: "system" as const,
          language: "ko",
          autoMoveTodos: true,
          showTaskMoveNotifications: true,
          completedTodoDisplay: "yesterday" as const,
          dateFormat: "YYYY-MM-DD" as const,
          timeFormat: "24h" as const,
          weekStart: "monday" as const,
          // notifications 객체 누락
          autoBackup: false,
          backupInterval: "weekly" as const,
        },
      };

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(
        JSON.stringify(dataWithoutNotifications),
      );

      const result = await repository.findByUserId(userId);

      expect(result).toBeInstanceOf(UserSettingsEntity);
      expect(result?.settings.notifications).toEqual({
        enabled: true,
        dailyReminder: false,
        weeklyReport: false,
      });
    });

    it("빈 notifications 객체인 경우 기본값으로 병합되어야 함", async () => {
      const userId = "user-1";
      const dataWithEmptyNotifications = {
        id: "settings-1",
        userId: "user-1",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        settings: {
          categories: [],
          categoryFilter: {},
          theme: "system" as const,
          language: "ko",
          autoMoveTodos: true,
          showTaskMoveNotifications: true,
          completedTodoDisplay: "yesterday" as const,
          dateFormat: "YYYY-MM-DD" as const,
          timeFormat: "24h" as const,
          weekStart: "monday" as const,
          notifications: {}, // 빈 객체
          autoBackup: false,
          backupInterval: "weekly" as const,
        },
      };

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(
        JSON.stringify(dataWithEmptyNotifications),
      );

      const result = await repository.findByUserId(userId);

      expect(result).toBeInstanceOf(UserSettingsEntity);
      expect(result?.settings.notifications).toEqual({
        enabled: true,
        dailyReminder: false,
        weeklyReport: false,
      });
    });

    it("카테고리의 order 필드가 누락된 경우 마이그레이션되어야 함", async () => {
      const userId = "user-1";
      const dataWithoutCategoryOrder = {
        id: "settings-1",
        userId: "user-1",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        settings: {
          categories: [
            {
              id: "cat-1",
              name: "개인",
              color: "#3b82f6",
              createdAt: "2023-01-01T00:00:00.000Z",
              // order 필드 없음
            },
            {
              id: "cat-2",
              name: "회사",
              color: "#10b981",
              createdAt: "2023-01-01T00:00:00.000Z",
              // order 필드 없음
            },
          ],
          categoryFilter: { "cat-1": true, "cat-2": true },
          theme: "system" as const,
          language: "ko",
          autoMoveTodos: true,
          showTaskMoveNotifications: true,
          completedTodoDisplay: "yesterday" as const,
          dateFormat: "YYYY-MM-DD" as const,
          timeFormat: "24h" as const,
          weekStart: "monday" as const,
          notifications: {
            enabled: true,
            dailyReminder: false,
            weeklyReport: false,
          },
          autoBackup: false,
          backupInterval: "weekly" as const,
        },
      };

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(
        JSON.stringify(dataWithoutCategoryOrder),
      );

      const result = await repository.findByUserId(userId);

      expect(result).toBeInstanceOf(UserSettingsEntity);

      // getCategories 호출 시 order 필드가 자동으로 마이그레이션됨
      const categories = result?.getCategories();
      expect(categories).toHaveLength(2);
      expect(categories?.[0].order).toBe(0);
      expect(categories?.[1].order).toBe(1);
    });

    it("완전히 새로운 데이터 구조에도 대응해야 함", async () => {
      const userId = "user-1";
      const completeNewData = {
        id: "settings-1",
        userId: "user-1",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        settings: {
          categories: [
            {
              id: "cat-1",
              name: "프로젝트",
              color: "#8b5cf6",
              createdAt: "2023-01-01T00:00:00.000Z",
              order: 0,
            },
          ],
          categoryFilter: { "cat-1": true },
          theme: "dark" as const,
          language: "en",
          autoMoveTodos: false,
          showTaskMoveNotifications: false,
          completedTodoDisplay: "all" as const,
          dateFormat: "DD/MM/YYYY" as const,
          timeFormat: "12h" as const,
          weekStart: "sunday" as const,
          notifications: {
            enabled: true,
            dailyReminder: true,
            weeklyReport: true,
          },
          autoBackup: true,
          backupInterval: "daily" as const,
        },
      };

      mockRedisService.generateKey.mockReturnValue("todo:user-settings:user-1");
      mockRedisService.get.mockResolvedValue(JSON.stringify(completeNewData));

      const result = await repository.findByUserId(userId);

      expect(result).toBeInstanceOf(UserSettingsEntity);

      // 모든 새 필드들이 올바르게 설정되어야 함
      expect(result?.settings.autoMoveTodos).toBe(false);
      expect(result?.settings.showTaskMoveNotifications).toBe(false);
      expect(result?.settings.completedTodoDisplay).toBe("all");
      expect(result?.settings.dateFormat).toBe("DD/MM/YYYY");
      expect(result?.settings.timeFormat).toBe("12h");
      expect(result?.settings.weekStart).toBe("sunday");
      expect(result?.settings.notifications).toEqual({
        enabled: true,
        dailyReminder: true,
        weeklyReport: true,
      });
      expect(result?.settings.autoBackup).toBe(true);
      expect(result?.settings.backupInterval).toBe("daily");
    });
  });
});
