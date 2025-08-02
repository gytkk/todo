import { Test, TestingModule } from "@nestjs/testing";
import { UserSettingsService } from "./user-settings.service";
import { UserSettingsRepository } from "./user-settings.repository";
import { UserSettingsEntity, UserSettingsData } from "./user-settings.entity";
import { NotFoundException, BadRequestException } from "@nestjs/common";

// 테스트용 기본 설정 헬퍼 함수
const createMockUserSettings = (
  overrides: Partial<UserSettingsData> = {},
): UserSettingsData => ({
  categories: [
    {
      id: "cat-1",
      name: "개인",
      color: "#3b82f6",
      createdAt: new Date("2023-01-01"),
      order: 0,
    },
    {
      id: "cat-2",
      name: "회사",
      color: "#10b981",
      createdAt: new Date("2023-01-01"),
      order: 1,
    },
  ],
  categoryFilter: { "cat-1": true, "cat-2": true },
  theme: "system",
  language: "ko",
  autoMoveTodos: true,
  showTaskMoveNotifications: true,
  completedTodoDisplay: "yesterday",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  weekStart: "monday",
  notifications: {
    enabled: true,
    dailyReminder: false,
    weeklyReport: false,
  },
  autoBackup: false,
  backupInterval: "weekly",
  ...overrides,
});

describe("UserSettingsService", () => {
  let service: UserSettingsService;

  const mockUserSettingsEntity = new UserSettingsEntity({
    id: "settings-1",
    userId: "user-1",
    settings: createMockUserSettings({
      categoryFilter: {
        "cat-1": true,
        "cat-2": true,
      },
      theme: "system",
      language: "ko",
    }),
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  });

  const mockRepository = {
    findOrCreate: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSettingsService,
        {
          provide: UserSettingsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserSettingsService>(UserSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserSettings", () => {
    it("사용자 설정을 성공적으로 조회해야 함", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.getUserSettings("user-1");

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(mockUserSettingsEntity.settings);
    });
  });

  describe("updateUserSettings", () => {
    it("사용자 설정을 성공적으로 업데이트해야 함", async () => {
      const updates = {
        theme: "dark" as const,
        language: "en",
      };

      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);
      mockRepository.update.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.updateUserSettings("user-1", updates);

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(mockRepository.update).toHaveBeenCalledWith(
        "user-1",
        mockUserSettingsEntity,
      );
      expect(result).toEqual(mockUserSettingsEntity.settings);
    });
  });

  describe("getUserCategories", () => {
    it("사용자 카테고리 목록을 성공적으로 조회해야 함", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.getUserCategories("user-1");

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        {
          id: "cat-1",
          name: "개인",
          color: "#3b82f6",
          createdAt: new Date("2023-01-01"),
          order: 0,
        },
        {
          id: "cat-2",
          name: "회사",
          color: "#10b981",
          createdAt: new Date("2023-01-01"),
          order: 1,
        },
      ]);
    });
  });

  describe("addCategory", () => {
    it("새로운 카테고리를 성공적으로 추가해야 함", async () => {
      // 기존 카테고리와 중복되지 않는 이름과 색상 사용
      const mockSettings = new UserSettingsEntity({
        ...mockUserSettingsEntity,
        settings: {
          ...mockUserSettingsEntity.settings,
        },
      });

      mockRepository.findOrCreate.mockResolvedValue(mockSettings);
      mockRepository.update.mockResolvedValue(mockSettings);

      const result = await service.addCategory("user-1", "프로젝트", "#8b5cf6");

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(mockRepository.update).toHaveBeenCalledWith(
        "user-1",
        expect.any(UserSettingsEntity),
      );
      expect(result).toEqual({
        id: expect.any(String) as string,
        name: "프로젝트",
        color: "#8b5cf6",
        createdAt: expect.any(Date) as Date,
        order: 2,
      });
    });

    it("중복된 카테고리 이름으로 추가 시 BadRequestException을 던져야 함", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      await expect(
        service.addCategory("user-1", "회사", "#8b5cf6"), // 기존 카테고리와 동일한 이름
      ).rejects.toThrow(
        new BadRequestException("Category name already exists"),
      );
    });

    it("중복된 색상으로 추가할 수 있어야 함 (색상 중복 허용)", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.addCategory(
        "user-1",
        "새 카테고리",
        "#3b82f6",
      );

      expect(result).toBeDefined();
      expect(result.color).toBe("#3b82f6");
      expect(result.name).toBe("새 카테고리");
    });

    it("카테고리 수 제한 초과 시 BadRequestException을 던져야 함", async () => {
      // 11개의 카테고리를 가진 설정 생성
      const settingsWithMaxCategories = new UserSettingsEntity({
        ...mockUserSettingsEntity,
        settings: {
          ...mockUserSettingsEntity.settings,
          categories: Array.from({ length: 11 }, (_, i) => ({
            id: `cat-${i + 1}`,
            name: `카테고리 ${i + 1}`,
            color: `#${i.toString(16).padStart(6, "0")}`,
            createdAt: new Date(),
          })),
        },
      });

      mockRepository.findOrCreate.mockResolvedValue(settingsWithMaxCategories);

      await expect(
        service.addCategory("user-1", "새 카테고리", "#ffffff"),
      ).rejects.toThrow(
        new BadRequestException("Maximum number of categories reached (11)"),
      );
    });
  });

  describe("updateCategory", () => {
    it("카테고리를 성공적으로 수정해야 함", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);
      mockRepository.update.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.updateCategory("user-1", "cat-1", {
        color: "#ff0000",
      });

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(mockRepository.update).toHaveBeenCalledWith(
        "user-1",
        mockUserSettingsEntity,
      );
      expect(result).toEqual({
        id: "cat-1",
        name: "개인",
        color: "#ff0000",
        createdAt: new Date("2023-01-01"),
        order: 0,
      });
    });

    it("존재하지 않는 카테고리 수정 시 NotFoundException을 던져야 함", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      await expect(
        service.updateCategory("user-1", "nonexistent", { name: "새 이름" }),
      ).rejects.toThrow(new NotFoundException("Category not found"));
    });

    it("중복된 이름으로 수정 시 BadRequestException을 던져야 함", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      await expect(
        service.updateCategory("user-1", "cat-1", { name: "회사" }),
      ).rejects.toThrow(
        new BadRequestException("Category name already exists"),
      );
    });

    it("중복된 색상으로 수정할 수 있어야 함 (색상 중복 허용)", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.updateCategory("user-1", "cat-1", {
        color: "#10b981",
      });

      expect(result).toBeDefined();
      expect(result.color).toBe("#10b981");
    });

    it("카테고리 업데이트 실패 시 BadRequestException을 던져야 함", async () => {
      // UserSettingsEntity.updateCategory에서 false 반환하도록 모킹
      const entitySpy = jest
        .spyOn(mockUserSettingsEntity, "updateCategory")
        .mockReturnValue(false);
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      await expect(
        service.updateCategory("user-1", "cat-1", { name: "새 이름" }),
      ).rejects.toThrow(new BadRequestException("Failed to update category"));

      entitySpy.mockRestore();
    });
  });

  describe("deleteCategory", () => {
    it("커스텀 카테고리를 성공적으로 삭제해야 함", async () => {
      const settingsWithCustomCategory = new UserSettingsEntity({
        ...mockUserSettingsEntity,
        settings: {
          ...mockUserSettingsEntity.settings,
          categories: [
            ...mockUserSettingsEntity.settings.categories,
            {
              id: "custom-1",
              name: "커스텀",
              color: "#ff0000",
              createdAt: new Date(),
            },
          ],
        },
      });

      mockRepository.findOrCreate.mockResolvedValue(settingsWithCustomCategory);
      mockRepository.update.mockResolvedValue(settingsWithCustomCategory);

      const result = await service.deleteCategory("user-1", "custom-1");

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(mockRepository.update).toHaveBeenCalledWith(
        "user-1",
        settingsWithCustomCategory,
      );
      expect(result).toEqual({ success: true, deletedId: "custom-1" });
    });

    it("존재하지 않는 카테고리 삭제 시 NotFoundException을 던져야 함", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      await expect(
        service.deleteCategory("user-1", "nonexistent"),
      ).rejects.toThrow(new NotFoundException("Category not found"));
    });

    it("마지막 카테고리 삭제 시도 시 BadRequestException을 던져야 함", async () => {
      const singleCategoryEntity = new UserSettingsEntity({
        ...mockUserSettingsEntity,
        settings: {
          ...mockUserSettingsEntity.settings,
          categories: [mockUserSettingsEntity.settings.categories[0]],
        },
      });
      mockRepository.findOrCreate.mockResolvedValue(singleCategoryEntity);

      await expect(service.deleteCategory("user-1", "cat-1")).rejects.toThrow(
        new BadRequestException(
          "Cannot delete the last category. At least one category must remain.",
        ),
      );
    });

    it("삭제 실패 시 BadRequestException을 던져야 함", async () => {
      const settingsWithCustomCategory = new UserSettingsEntity({
        ...mockUserSettingsEntity,
        settings: {
          ...mockUserSettingsEntity.settings,
          categories: [
            ...mockUserSettingsEntity.settings.categories,
            {
              id: "custom-1",
              name: "커스텀",
              color: "#ff0000",
              createdAt: new Date(),
            },
          ],
        },
      });

      // deleteCategory에서 false 반환하도록 모킹
      const entitySpy = jest
        .spyOn(settingsWithCustomCategory, "deleteCategory")
        .mockReturnValue(false);
      mockRepository.findOrCreate.mockResolvedValue(settingsWithCustomCategory);

      await expect(
        service.deleteCategory("user-1", "custom-1"),
      ).rejects.toThrow(
        new BadRequestException(
          "Cannot delete the last category. At least one category must remain.",
        ),
      );

      entitySpy.mockRestore();
    });
  });

  describe("getAvailableColors", () => {
    it("사용 가능한 색상 목록을 반환해야 함", async () => {
      // Mock the getAvailableColors method instead of using the entity directly
      const mockAvailableColors = ["#f97316", "#ef4444", "#8b5cf6", "#ec4899"];
      const entitySpy = jest
        .spyOn(mockUserSettingsEntity, "getAvailableColors")
        .mockReturnValue(mockAvailableColors);

      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.getAvailableColors("user-1");

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // 현재 사용 중인 색상들은 포함되지 않아야 함
      expect(result).not.toContain("#3b82f6");
      expect(result).not.toContain("#10b981");

      entitySpy.mockRestore();
    });
  });

  describe("getCategoryById", () => {
    it("존재하는 카테고리를 성공적으로 반환해야 함", async () => {
      // Mock the getCategoryById to return the expected category
      const mockCategory = {
        id: "cat-1",
        name: "개인",
        color: "#3b82f6",
        createdAt: new Date("2023-01-01"),
      };

      const entitySpy = jest
        .spyOn(mockUserSettingsEntity, "getCategoryById")
        .mockReturnValue(mockCategory);

      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.getCategoryById("user-1", "cat-1");

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(result).toEqual({
        id: "cat-1",
        name: "개인",
        color: "#3b82f6",
        createdAt: new Date("2023-01-01"),
        order: 0,
      });

      entitySpy.mockRestore();
    });

    it("존재하지 않는 카테고리에 대해 null을 반환해야 함", async () => {
      const entitySpy = jest
        .spyOn(mockUserSettingsEntity, "getCategoryById")
        .mockReturnValue(null);

      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.getCategoryById("user-1", "nonexistent");

      expect(result).toBeNull();

      entitySpy.mockRestore();
    });
  });

  describe("updateCategoryFilter", () => {
    it("카테고리 필터를 성공적으로 업데이트해야 함", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);
      mockRepository.update.mockResolvedValue(mockUserSettingsEntity);

      await service.updateCategoryFilter("user-1", "cat-1", false);

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(mockRepository.update).toHaveBeenCalledWith(
        "user-1",
        mockUserSettingsEntity,
      );
    });
  });

  describe("getCategoryFilter", () => {
    it("카테고리 필터를 성공적으로 조회해야 함", async () => {
      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.getCategoryFilter("user-1");

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(typeof result).toBe("object");
      expect(result).toHaveProperty("cat-1");
      expect(result).toHaveProperty("cat-2");
    });
  });

  describe("reorderCategories", () => {
    it("카테고리 순서를 성공적으로 변경해야 함", async () => {
      const reorderedIds = ["cat-2", "cat-1"]; // 순서 바꿈
      const reorderSpy = jest
        .spyOn(mockUserSettingsEntity, "reorderCategories")
        .mockReturnValue(true);

      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);
      mockRepository.update.mockResolvedValue(mockUserSettingsEntity);

      const result = await service.reorderCategories("user-1", reorderedIds);

      expect(mockRepository.findOrCreate).toHaveBeenCalledWith("user-1");
      expect(reorderSpy).toHaveBeenCalledWith(reorderedIds);
      expect(mockRepository.update).toHaveBeenCalledWith(
        "user-1",
        mockUserSettingsEntity,
      );
      expect(Array.isArray(result)).toBe(true);

      reorderSpy.mockRestore();
    });

    it("잘못된 카테고리 순서 요청 시 BadRequestException을 던져야 함", async () => {
      const invalidIds = ["cat-1", "invalid-id"];
      const reorderSpy = jest
        .spyOn(mockUserSettingsEntity, "reorderCategories")
        .mockReturnValue(false);

      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      await expect(
        service.reorderCategories("user-1", invalidIds),
      ).rejects.toThrow(
        new BadRequestException("Invalid category order provided"),
      );

      expect(reorderSpy).toHaveBeenCalledWith(invalidIds);
      reorderSpy.mockRestore();
    });

    it("빈 배열로 순서 변경 시 BadRequestException을 던져야 함", async () => {
      const emptyIds: string[] = [];
      const reorderSpy = jest
        .spyOn(mockUserSettingsEntity, "reorderCategories")
        .mockReturnValue(false);

      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      await expect(
        service.reorderCategories("user-1", emptyIds),
      ).rejects.toThrow(
        new BadRequestException("Invalid category order provided"),
      );

      expect(reorderSpy).toHaveBeenCalledWith(emptyIds);
      reorderSpy.mockRestore();
    });

    it("길이가 다른 배열로 순서 변경 시 BadRequestException을 던져야 함", async () => {
      const tooManyIds = ["cat-1", "cat-2", "extra-id"];
      const reorderSpy = jest
        .spyOn(mockUserSettingsEntity, "reorderCategories")
        .mockReturnValue(false);

      mockRepository.findOrCreate.mockResolvedValue(mockUserSettingsEntity);

      await expect(
        service.reorderCategories("user-1", tooManyIds),
      ).rejects.toThrow(
        new BadRequestException("Invalid category order provided"),
      );

      expect(reorderSpy).toHaveBeenCalledWith(tooManyIds);
      reorderSpy.mockRestore();
    });
  });
});
