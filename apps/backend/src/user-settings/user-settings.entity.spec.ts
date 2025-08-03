import { UserSettingsEntity, UserSettingsData } from "./user-settings.entity";

// 테스트용 기본 설정 헬퍼 함수
const createMockUserSettings = (
  overrides: Partial<UserSettingsData> = {},
): UserSettingsData => ({
  categories: [
    {
      id: "default-1",
      name: "기본",
      color: "#3b82f6",
      createdAt: new Date(),
      order: 0,
    },
  ],
  categoryFilter: { "default-1": true },
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
  // 새로 추가된 필드들
  themeColor: "#3b82f6",
  customColor: "#3b82f6",
  defaultView: "month",
  timezone: "Asia/Seoul",
  oldTodoDisplayLimit: 14,
  saturationAdjustment: {
    enabled: true,
    levels: [
      { days: 1, opacity: 0.9 },
      { days: 3, opacity: 0.7 },
      { days: 7, opacity: 0.5 },
      { days: 14, opacity: 0.3 },
      { days: 30, opacity: 0.1 },
    ],
  },
  showWeekends: true,
  ...overrides,
});

describe("UserSettingsEntity", () => {
  describe("constructor", () => {
    it("새로운 UserSettingsEntity를 기본값으로 생성해야 함", () => {
      const entity = new UserSettingsEntity({ userId: "user-1" });

      expect(entity.userId).toBe("user-1");
      expect(entity.id).toBeDefined();
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.settings).toBeDefined();
      expect(entity.settings.categories).toHaveLength(2); // 기본 카테고리 2개
      expect(entity.settings.theme).toBe("system");
      expect(entity.settings.language).toBe("ko");
    });

    it("제공된 데이터로 UserSettingsEntity를 생성해야 함", () => {
      const customSettings: UserSettingsData = createMockUserSettings({
        categories: [
          {
            id: "custom-1",
            name: "커스텀",
            color: "#FF0000",
            createdAt: new Date(),
          },
        ],
        categoryFilter: { "custom-1": true },
        theme: "dark",
        language: "en",
      });

      const entity = new UserSettingsEntity({
        id: "settings-1",
        userId: "user-1",
        settings: customSettings,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      });

      expect(entity.id).toBe("settings-1");
      expect(entity.userId).toBe("user-1");
      expect(entity.settings.theme).toBe("dark");
      expect(entity.settings.language).toBe("en");
      expect(entity.settings.categories).toHaveLength(1);
      expect(entity.createdAt).toEqual(new Date("2023-01-01"));
      expect(entity.updatedAt).toEqual(new Date("2023-01-02"));
    });

    it("확장된 설정 필드들의 기본값이 올바르게 설정되어야 함", () => {
      const entity = new UserSettingsEntity({ userId: "user-1" });

      // 할일 관련 기본 설정
      expect(entity.settings.autoMoveTodos).toBe(true);
      expect(entity.settings.showTaskMoveNotifications).toBe(true);
      expect(entity.settings.completedTodoDisplay).toBe("yesterday");

      // 캘린더 기본 설정
      expect(entity.settings.dateFormat).toBe("YYYY-MM-DD");
      expect(entity.settings.timeFormat).toBe("24h");
      expect(entity.settings.weekStart).toBe("monday");

      // 알림 기본 설정
      expect(entity.settings.notifications).toEqual({
        enabled: true,
        dailyReminder: false,
        weeklyReport: false,
      });

      // 데이터 관리 기본 설정
      expect(entity.settings.autoBackup).toBe(false);
      expect(entity.settings.backupInterval).toBe("weekly");
    });

    it("부분적인 기존 데이터로 생성 시 누락된 필드가 기본값으로 병합되어야 함", () => {
      // 일부 필드만 포함된 기존 설정
      const partialSettings: Partial<UserSettingsData> = {
        categories: [
          {
            id: "cat-1",
            name: "테스트",
            color: "#ff0000",
            createdAt: new Date(),
            order: 0,
          },
        ],
        categoryFilter: { "cat-1": true },
        theme: "dark" as const,
        language: "en",
        // 나머지 필드들은 누락됨
      };

      const entity = new UserSettingsEntity({
        userId: "user-1",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        settings: partialSettings as any, // 타입 호환성을 위한 캐스팅
      });

      // 제공된 필드는 유지
      expect(entity.settings.theme).toBe("dark");
      expect(entity.settings.language).toBe("en");
      expect(entity.settings.categories).toHaveLength(1);

      // 누락된 필드들은 기본값으로 설정
      expect(entity.settings.autoMoveTodos).toBe(true);
      expect(entity.settings.showTaskMoveNotifications).toBe(true);
      expect(entity.settings.completedTodoDisplay).toBe("yesterday");
      expect(entity.settings.dateFormat).toBe("YYYY-MM-DD");
      expect(entity.settings.timeFormat).toBe("24h");
      expect(entity.settings.weekStart).toBe("monday");
      expect(entity.settings.notifications).toEqual({
        enabled: true,
        dailyReminder: false,
        weeklyReport: false,
      });
      expect(entity.settings.autoBackup).toBe(false);
      expect(entity.settings.backupInterval).toBe("weekly");
    });

    it("notifications 객체의 부분적 제공 시 나머지는 기본값으로 병합되어야 함", () => {
      const partialSettings: Partial<UserSettingsData> = {
        categories: [
          {
            id: "cat-1",
            name: "테스트",
            color: "#ff0000",
            createdAt: new Date(),
            order: 0,
          },
        ],
        categoryFilter: { "cat-1": true },
        theme: "system" as const,
        language: "ko",
        autoMoveTodos: true,
        showTaskMoveNotifications: true,
        completedTodoDisplay: "yesterday" as const,
        dateFormat: "YYYY-MM-DD" as const,
        timeFormat: "24h" as const,
        weekStart: "monday" as const,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        notifications: {
          enabled: false, // 일부만 제공
          // dailyReminder, weeklyReport는 누락
        } as any,
        autoBackup: false,
        backupInterval: "weekly" as const,
      };

      const entity = new UserSettingsEntity({
        userId: "user-1",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        settings: partialSettings as any, // 타입 호환성을 위한 캐스팅
      });

      // 제공된 notifications.enabled는 유지
      expect(entity.settings.notifications.enabled).toBe(false);
      // 누락된 필드들은 기본값으로 설정
      expect(entity.settings.notifications.dailyReminder).toBe(false);
      expect(entity.settings.notifications.weeklyReport).toBe(false);
    });

    it("빈 notifications 객체 제공 시 모든 필드가 기본값으로 설정되어야 함", () => {
      const partialSettings: Partial<UserSettingsData> = {
        categories: [
          {
            id: "cat-1",
            name: "테스트",
            color: "#ff0000",
            createdAt: new Date(),
            order: 0,
          },
        ],
        categoryFilter: { "cat-1": true },
        theme: "system" as const,
        language: "ko",
        autoMoveTodos: true,
        showTaskMoveNotifications: true,
        completedTodoDisplay: "yesterday" as const,
        dateFormat: "YYYY-MM-DD" as const,
        timeFormat: "24h" as const,
        weekStart: "monday" as const,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        notifications: {} as any, // 빈 객체
        autoBackup: false,
        backupInterval: "weekly" as const,
      };

      const entity = new UserSettingsEntity({
        userId: "user-1",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        settings: partialSettings as any, // 타입 호환성을 위한 캐스팅
      });

      expect(entity.settings.notifications).toEqual({
        enabled: true,
        dailyReminder: false,
        weeklyReport: false,
      });
    });

    it("레거시 데이터 (확장 필드 없음)로 생성 시 기본값들이 추가되어야 함", () => {
      // 확장 전의 레거시 설정 데이터
      const legacySettings: Partial<UserSettingsData> = {
        categories: [
          {
            id: "cat-1",
            name: "개인",
            color: "#3b82f6",
            createdAt: new Date(),
          },
        ],
        categoryFilter: { "cat-1": true },
        theme: "light" as const,
        language: "ko",
        // 확장된 필드들은 모두 누락
      };

      const entity = new UserSettingsEntity({
        userId: "user-1",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        settings: legacySettings as any, // 레거시 데이터 호환성을 위한 캐스팅
      });

      // 기존 필드는 유지
      expect(entity.settings.theme).toBe("light");
      expect(entity.settings.language).toBe("ko");

      // 새로 추가된 모든 필드들이 기본값으로 설정되어야 함
      expect(entity.settings.autoMoveTodos).toBe(true);
      expect(entity.settings.showTaskMoveNotifications).toBe(true);
      expect(entity.settings.completedTodoDisplay).toBe("yesterday");
      expect(entity.settings.dateFormat).toBe("YYYY-MM-DD");
      expect(entity.settings.timeFormat).toBe("24h");
      expect(entity.settings.weekStart).toBe("monday");
      expect(entity.settings.notifications).toEqual({
        enabled: true,
        dailyReminder: false,
        weeklyReport: false,
      });
      expect(entity.settings.autoBackup).toBe(false);
      expect(entity.settings.backupInterval).toBe("weekly");
    });

    it("기본 카테고리가 올바르게 생성되어야 함", () => {
      const entity = new UserSettingsEntity({ userId: "user-1" });
      const categories = entity.settings.categories;

      expect(categories).toHaveLength(2);

      const categoryNames = categories.map((cat) => cat.name);
      expect(categoryNames).toContain("회사");
      expect(categoryNames).toContain("개인");

      // 모든 기본 카테고리는 기본 데이터로 생성되어야 함
      categories.forEach((cat) => {
        expect(cat.id).toBeDefined();
        expect(cat.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(cat.createdAt).toBeInstanceOf(Date);
      });
    });

    it("기본 카테고리 필터가 올바르게 설정되어야 함", () => {
      const entity = new UserSettingsEntity({ userId: "user-1" });
      const filter = entity.settings.categoryFilter;

      // 모든 기본 카테고리가 true로 설정되어야 함
      entity.settings.categories.forEach((cat) => {
        expect(filter[cat.id]).toBe(true);
      });
    });
  });

  describe("getCategories", () => {
    it("TodoCategory 형태로 카테고리를 반환해야 함", () => {
      const entity = new UserSettingsEntity({ userId: "user-1" });
      const categories = entity.getCategories();

      expect(categories).toHaveLength(2);
      categories.forEach((cat) => {
        expect(cat).toHaveProperty("id");
        expect(cat).toHaveProperty("name");
        expect(cat).toHaveProperty("color");
        expect(cat).toHaveProperty("createdAt");
        // 기본 카테고리들은 기본 데이터로 생성됨
      });
    });
  });

  describe("addCategory", () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: "user-1" });
    });

    it("새로운 카테고리를 성공적으로 추가해야 함", () => {
      const initialCount = entity.settings.categories.length;
      const oldUpdatedAt = entity.updatedAt;

      const categoryId = entity.addCategory("프로젝트", "#8B5CF6");

      expect(categoryId).toBeDefined();
      expect(entity.settings.categories).toHaveLength(initialCount + 1);

      const addedCategory = entity.getCategoryById(categoryId);
      expect(addedCategory).toBeDefined();
      expect(addedCategory!.name).toBe("프로젝트");
      expect(addedCategory!.color).toBe("#8B5CF6");
      // 추가된 카테고리는 커스텀 카테고리임
      expect(addedCategory!.createdAt).toBeInstanceOf(Date);

      // 카테고리 필터가 true로 설정되어야 함
      expect(entity.settings.categoryFilter[categoryId]).toBe(true);

      // updatedAt이 갱신되어야 함
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });

    it("추가된 카테고리에 고유한 ID가 생성되어야 함", () => {
      const id1 = entity.addCategory("카테고리1", "#FF0000");
      const id2 = entity.addCategory("카테고리2", "#00FF00");

      expect(id1).not.toBe(id2);
      expect(entity.getCategoryById(id1)?.name).toBe("카테고리1");
      expect(entity.getCategoryById(id2)?.name).toBe("카테고리2");
    });
  });

  describe("updateCategory", () => {
    let entity: UserSettingsEntity;
    let customCategoryId: string;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: "user-1" });
      customCategoryId = entity.addCategory("커스텀", "#FF0000");
    });

    it("커스텀 카테고리 이름을 성공적으로 수정해야 함", () => {
      const oldUpdatedAt = entity.updatedAt;

      const success = entity.updateCategory(customCategoryId, {
        name: "수정된 이름",
      });

      expect(success).toBe(true);
      const updatedCategory = entity.getCategoryById(customCategoryId);
      expect(updatedCategory!.name).toBe("수정된 이름");
      expect(updatedCategory!.color).toBe("#FF0000"); // 색상은 유지
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });

    it("커스텀 카테고리 색상을 성공적으로 수정해야 함", () => {
      const success = entity.updateCategory(customCategoryId, {
        color: "#00FF00",
      });

      expect(success).toBe(true);
      const updatedCategory = entity.getCategoryById(customCategoryId);
      expect(updatedCategory!.color).toBe("#00FF00");
      expect(updatedCategory!.name).toBe("커스텀"); // 이름은 유지
    });

    it("이름과 색상을 모두 수정해야 함", () => {
      const success = entity.updateCategory(customCategoryId, {
        name: "새로운 이름",
        color: "#0000FF",
      });

      expect(success).toBe(true);
      const updatedCategory = entity.getCategoryById(customCategoryId);
      expect(updatedCategory!.name).toBe("새로운 이름");
      expect(updatedCategory!.color).toBe("#0000FF");
    });

    it("카테고리 이름을 성공적으로 수정해야 함", () => {
      const categories = entity.getCategories();
      const categoryId = categories[0].id;
      const originalName = categories[0].name;

      const success = entity.updateCategory(categoryId, {
        name: "수정된 카테고리",
      });

      expect(success).toBe(true);
      const category = entity.getCategoryById(categoryId);
      expect(category!.name).toBe("수정된 카테고리");
      expect(category!.name).not.toBe(originalName);
    });

    it("카테고리 색상을 성공적으로 수정해야 함", () => {
      const categories = entity.getCategories();
      const categoryId = categories[0].id;
      const originalName = entity.getCategoryById(categoryId)!.name;

      const success = entity.updateCategory(categoryId, {
        color: "#ABCDEF",
      });

      expect(success).toBe(true);
      const category = entity.getCategoryById(categoryId);
      expect(category!.color).toBe("#ABCDEF");
      expect(category!.name).toBe(originalName); // 이름은 유지
    });

    it("존재하지 않는 카테고리 수정 시 false를 반환해야 함", () => {
      const success = entity.updateCategory("nonexistent-id", { name: "수정" });

      expect(success).toBe(false);
    });
  });

  describe("deleteCategory", () => {
    let entity: UserSettingsEntity;
    let customCategoryId: string;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: "user-1" });
      customCategoryId = entity.addCategory("삭제할 카테고리", "#FF0000");
    });

    it("커스텀 카테고리를 성공적으로 삭제해야 함", () => {
      const initialCount = entity.settings.categories.length;
      const oldUpdatedAt = entity.updatedAt;

      const success = entity.deleteCategory(customCategoryId);

      expect(success).toBe(true);
      expect(entity.settings.categories).toHaveLength(initialCount - 1);
      expect(entity.getCategoryById(customCategoryId)).toBeNull();

      // 카테고리 필터에서도 제거되어야 함
      expect(entity.settings.categoryFilter[customCategoryId]).toBeUndefined();

      // updatedAt이 갱신되어야 함
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });

    it("마지막 카테고리 삭제를 거부해야 함", () => {
      // 이 테스트는 beforeEach에서 customCategoryId를 추가한 상태에서 실행됨
      // 따라서 3개의 카테고리가 있음: 기본 2개 + 커스텀 1개
      const categories = entity.getCategories();
      expect(categories).toHaveLength(3); // 기본 2개 + 커스텀 1개

      // 2개 삭제해서 1개만 남김
      entity.deleteCategory(customCategoryId); // 커스텀 카테고리 삭제
      entity.deleteCategory(categories[1].id); // 두 번째 기본 카테고리 삭제

      const remainingCategories = entity.getCategories();
      expect(remainingCategories).toHaveLength(1);

      const lastCategoryId = remainingCategories[0].id;
      const success = entity.deleteCategory(lastCategoryId);

      expect(success).toBe(false);
      expect(entity.settings.categories).toHaveLength(1);
      expect(entity.getCategoryById(lastCategoryId)).toBeDefined();
    });

    it("존재하지 않는 카테고리 삭제 시 false를 반환해야 함", () => {
      const success = entity.deleteCategory("nonexistent-id");

      expect(success).toBe(false);
    });
  });

  describe("getCategoryById", () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: "user-1" });
    });

    it("존재하는 카테고리를 반환해야 함", () => {
      const categories = entity.getCategories();
      const categoryId = categories[0].id;

      const foundCategory = entity.getCategoryById(categoryId);

      expect(foundCategory).toBeDefined();
      expect(foundCategory!.id).toBe(categoryId);
    });

    it("존재하지 않는 카테고리에 대해 null을 반환해야 함", () => {
      const foundCategory = entity.getCategoryById("nonexistent-id");

      expect(foundCategory).toBeNull();
    });
  });

  describe("updateCategoryFilter", () => {
    let entity: UserSettingsEntity;
    let categoryId: string;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: "user-1" });
      categoryId = entity.getCategories()[0].id;
    });

    it("카테고리 필터를 활성화해야 함", () => {
      const oldUpdatedAt = entity.updatedAt;

      entity.updateCategoryFilter(categoryId, true);

      expect(entity.settings.categoryFilter[categoryId]).toBe(true);
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });

    it("카테고리 필터를 비활성화해야 함", () => {
      entity.updateCategoryFilter(categoryId, false);

      expect(entity.settings.categoryFilter[categoryId]).toBe(false);
    });
  });

  describe("getAvailableColors", () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: "user-1" });
    });

    it("모든 사용 가능한 색상들을 반환해야 함 (중복 허용)", () => {
      const availableColors = entity.getAvailableColors();

      // 중복 색상을 허용하므로 모든 색상이 반환되어야 함
      expect(availableColors).toHaveLength(9); // 기본 9개 색상

      // 모든 반환된 색상이 유효한 헥스 색상이어야 함
      availableColors.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("새 카테고리를 추가해도 available colors는 변하지 않아야 함 (중복 허용)", () => {
      const initialAvailableColors = entity.getAvailableColors();
      const colorToUse = initialAvailableColors[0];

      entity.addCategory("새 카테고리", colorToUse);

      const updatedAvailableColors = entity.getAvailableColors();
      // 중복 색상을 허용하므로 색상이 여전히 존재해야 함
      expect(updatedAvailableColors).toContain(colorToUse);
      expect(updatedAvailableColors).toHaveLength(
        initialAvailableColors.length,
      );
    });
  });

  describe("updateSettings", () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: "user-1" });
    });

    it("설정을 부분적으로 업데이트해야 함", () => {
      const oldUpdatedAt = entity.updatedAt;
      const originalCategories = entity.settings.categories;

      entity.updateSettings({
        theme: "dark",
        language: "en",
      });

      expect(entity.settings.theme).toBe("dark");
      expect(entity.settings.language).toBe("en");
      expect(entity.settings.categories).toBe(originalCategories); // 다른 설정은 유지
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });

    it("전체 설정을 업데이트해야 함", () => {
      const newSettings: UserSettingsData = createMockUserSettings({
        categories: [
          {
            id: "new-cat",
            name: "새 카테고리",
            color: "#123456",
            createdAt: new Date(),
          },
        ],
        categoryFilter: { "new-cat": true },
        theme: "light",
        language: "ko",
      });

      entity.updateSettings(newSettings);

      expect(entity.settings).toEqual(newSettings);
    });
  });

  describe("createDefault", () => {
    it("기본 설정으로 새 UserSettingsEntity를 생성해야 함", () => {
      const entity = UserSettingsEntity.createDefault("user-123");

      expect(entity.userId).toBe("user-123");
      expect(entity.id).toBeDefined();
      expect(entity.settings.categories).toHaveLength(2);
      expect(entity.settings.theme).toBe("system");
      expect(entity.settings.language).toBe("ko");
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("reorderCategories", () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: "user-1" });
    });

    it("유효한 카테고리 순서로 재정렬해야 함", () => {
      const categories = entity.getCategories();
      const originalFirstId = categories[0].id;
      const originalSecondId = categories[1].id;

      // 순서를 바꾼 배열
      const newOrder = [originalSecondId, originalFirstId];

      const result = entity.reorderCategories(newOrder);

      expect(result).toBe(true);

      const reorderedCategories = entity.getCategories();
      expect(reorderedCategories[0].id).toBe(originalSecondId);
      expect(reorderedCategories[1].id).toBe(originalFirstId);
      expect(reorderedCategories[0].order).toBe(0);
      expect(reorderedCategories[1].order).toBe(1);
    });

    it("잘못된 길이의 배열로 재정렬 시 false를 반환해야 함", () => {
      const result = entity.reorderCategories(["only-one-id"]);
      expect(result).toBe(false);
    });

    it("존재하지 않는 카테고리 ID로 재정렬 시 false를 반환해야 함", () => {
      const categories = entity.getCategories();
      const invalidOrder = ["invalid-id", categories[1].id];

      const result = entity.reorderCategories(invalidOrder);
      expect(result).toBe(false);
    });

    it("빈 배열로 재정렬 시 false를 반환해야 함", () => {
      const result = entity.reorderCategories([]);
      expect(result).toBe(false);
    });

    it("중복된 ID가 있는 배열로 재정렬 시 false를 반환해야 함", () => {
      const categories = entity.getCategories();
      const duplicateOrder = [categories[0].id, categories[0].id]; // 같은 ID 중복

      const result = entity.reorderCategories(duplicateOrder);
      expect(result).toBe(false);
    });
  });

  describe("ensureCategoryOrder 마이그레이션", () => {
    it("order 필드가 없는 기존 카테고리에 order를 추가해야 함", () => {
      // order 필드가 없는 카테고리 데이터로 엔티티 생성
      const entity = new UserSettingsEntity({
        userId: "user-1",
        settings: createMockUserSettings({
          categories: [
            {
              id: "cat-1",
              name: "개인",
              color: "#3b82f6",
              createdAt: new Date("2023-01-01"),
              order: undefined, // order 필드를 명시적으로 undefined로 설정
            },
            {
              id: "cat-2",
              name: "회사",
              color: "#10b981",
              createdAt: new Date("2023-01-01"),
              order: undefined, // order 필드를 명시적으로 undefined로 설정
            },
          ],
          categoryFilter: {},
          theme: "system",
          language: "ko",
        }),
      });

      // getCategories 호출 시 마이그레이션이 자동으로 실행됨
      const categories = entity.getCategories();

      expect(categories[0].order).toBe(0);
      expect(categories[1].order).toBe(1);
      expect(categories).toHaveLength(2);
    });

    it("order 필드가 이미 있는 카테고리는 변경하지 않아야 함", () => {
      const entity = new UserSettingsEntity({
        userId: "user-1",
        settings: createMockUserSettings({
          categories: [
            {
              id: "cat-1",
              name: "개인",
              color: "#3b82f6",
              createdAt: new Date("2023-01-01"),
              order: 5, // 이미 order 필드 존재
            },
            {
              id: "cat-2",
              name: "회사",
              color: "#10b981",
              createdAt: new Date("2023-01-01"),
              order: 3, // 이미 order 필드 존재
            },
          ],
          categoryFilter: {},
          theme: "system",
          language: "ko",
        }),
      });

      const categories = entity.getCategories();

      // 기존 order 값이 유지되어야 함
      expect(categories.find((c) => c.id === "cat-2")?.order).toBe(3);
      expect(categories.find((c) => c.id === "cat-1")?.order).toBe(5);
    });

    it("일부 카테고리만 order 필드가 없을 때 올바르게 마이그레이션해야 함", () => {
      const entity = new UserSettingsEntity({
        userId: "user-1",
        settings: createMockUserSettings({
          categories: [
            {
              id: "cat-1",
              name: "개인",
              color: "#3b82f6",
              createdAt: new Date("2023-01-01"),
              order: 0, // 이미 order 필드 존재
            },
            {
              id: "cat-2",
              name: "회사",
              color: "#10b981",
              createdAt: new Date("2023-01-01"),
              order: undefined, // order 필드를 명시적으로 undefined로 설정
            },
            {
              id: "cat-3",
              name: "프로젝트",
              color: "#8b5cf6",
              createdAt: new Date("2023-01-01"),
              order: undefined, // order 필드를 명시적으로 undefined로 설정
            },
          ],
          categoryFilter: {},
          theme: "system",
          language: "ko",
        }),
      });

      const categories = entity.getCategories();

      expect(categories.find((c) => c.id === "cat-1")?.order).toBe(0); // 기존 값 유지
      expect(categories.find((c) => c.id === "cat-2")?.order).toBe(1); // 인덱스로 설정
      expect(categories.find((c) => c.id === "cat-3")?.order).toBe(2); // 인덱스로 설정
    });
  });

  describe("addCategory with order", () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: "user-1" });
    });

    it("새 카테고리 추가 시 올바른 order 값을 할당해야 함", () => {
      const existingCategories = entity.getCategories();
      const maxOrder = Math.max(...existingCategories.map((c) => c.order));

      const newCategoryId = entity.addCategory("새 카테고리", "#ff0000");
      const newCategory = entity.getCategoryById(newCategoryId);

      expect(newCategory?.order).toBe(maxOrder + 1);
    });

    it("첫 번째 카테고리들을 모두 삭제 후 새 카테고리 추가 시 order가 올바르게 설정되어야 함", () => {
      // 모든 기본 카테고리 삭제 (마지막 하나 제외)
      const categories = entity.getCategories();
      for (let i = categories.length - 1; i > 0; i--) {
        entity.deleteCategory(categories[i].id);
      }

      const newCategoryId = entity.addCategory("새 카테고리", "#ff0000");
      const newCategory = entity.getCategoryById(newCategoryId);

      expect(newCategory?.order).toBe(1); // 남은 카테고리의 order + 1
    });
  });
});
