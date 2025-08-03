import { v4 as uuidv4 } from "uuid";
import { TodoCategory } from "@calendar-todo/shared-types";

export interface UserCategoryData {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  order?: number; // optional for backward compatibility
}

export interface UserSettingsData {
  categories: UserCategoryData[];
  categoryFilter: { [categoryId: string]: boolean };
  theme: "light" | "dark" | "system";
  language: string;

  // 할일 관련 설정
  autoMoveTodos: boolean; // 미완료 작업 자동 이동
  showTaskMoveNotifications: boolean; // 작업 이동 알림 표시
  completedTodoDisplay: "all" | "yesterday" | "none"; // 완료된 할일 표시 방식

  // 캘린더 설정
  dateFormat: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  timeFormat: "12h" | "24h";
  weekStart: "sunday" | "monday" | "saturday";

  // 알림 설정
  notifications: {
    enabled: boolean;
    dailyReminder: boolean;
    weeklyReport: boolean;
  };

  // 데이터 관리 설정
  autoBackup: boolean;
  backupInterval: "daily" | "weekly" | "monthly";

  // 새로 추가된 설정들 (프론트엔드 AppSettings와 동기화)
  themeColor: string; // 프리셋 테마 색상
  customColor: string; // 사용자 정의 색상
  defaultView: "month" | "week" | "day"; // 기본 캘린더 보기
  timezone: string; // 타임존 설정
  oldTodoDisplayLimit: number; // 오래된 할일 표시 제한 (일 단위)
  saturationAdjustment: {
    enabled: boolean;
    levels: Array<{ days: number; opacity: number }>;
  }; // 포화도 조정 설정
  showWeekends: boolean; // 주말 표시 여부
}

export class UserSettingsEntity {
  id: string;
  userId: string;
  settings: UserSettingsData;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<UserSettingsEntity>) {
    this.id = data.id || uuidv4();
    this.userId = data.userId || "";

    // 기본값과 전달받은 설정을 병합하여 누락된 필드 보완
    const defaultSettings = this.getDefaultSettings();
    this.settings = data.settings
      ? {
          ...defaultSettings,
          ...data.settings,
          // notifications 객체는 중첩되어 있으므로 별도로 병합
          notifications: {
            ...defaultSettings.notifications,
            ...(data.settings.notifications || {}),
          },
          // saturationAdjustment 객체도 중첩되어 있으므로 별도로 병합
          saturationAdjustment: {
            ...defaultSettings.saturationAdjustment,
            ...(data.settings.saturationAdjustment || {}),
            // levels 배열은 완전 교체 (기본값과 병합하지 않음)
            levels:
              data.settings.saturationAdjustment?.levels ||
              defaultSettings.saturationAdjustment.levels,
          },
        }
      : defaultSettings;

    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  private getDefaultSettings(): UserSettingsData {
    const defaultCategories = this.createDefaultCategories();
    return {
      categories: defaultCategories,
      categoryFilter: defaultCategories.reduce(
        (acc, cat) => ({
          ...acc,
          [cat.id]: true,
        }),
        {},
      ),
      theme: "system",
      language: "ko",

      // 할일 관련 기본 설정
      autoMoveTodos: true,
      showTaskMoveNotifications: true,
      completedTodoDisplay: "yesterday",

      // 캘린더 기본 설정
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24h",
      weekStart: "monday",

      // 알림 기본 설정
      notifications: {
        enabled: true,
        dailyReminder: false,
        weeklyReport: false,
      },

      // 데이터 관리 기본 설정
      autoBackup: false,
      backupInterval: "weekly",

      // 새로 추가된 설정들의 기본값
      themeColor: "#3b82f6", // 기본 파란색
      customColor: "#3b82f6",
      defaultView: "month",
      timezone: "Asia/Seoul",
      oldTodoDisplayLimit: 14, // 14일 이전 할일까지 표시
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
    };
  }

  private createDefaultCategories(): UserCategoryData[] {
    return [
      {
        id: uuidv4(),
        name: "개인",
        color: "#3b82f6",
        createdAt: new Date(),
        order: 0,
      },
      {
        id: uuidv4(),
        name: "회사",
        color: "#10b981",
        createdAt: new Date(),
        order: 1,
      },
    ];
  }

  // Get categories as TodoCategory array for frontend
  getCategories(): TodoCategory[] {
    // 기존 카테고리들의 order 필드 migration
    this.ensureCategoryOrder();

    return this.settings.categories
      .sort((a, b) => (a.order || 0) - (b.order || 0)) // 순서대로 정렬 (order가 없을 경우 0으로 처리)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        createdAt: cat.createdAt,
        order: cat.order || 0,
      }));
  }

  // 기존 카테고리들에 order 필드가 없는 경우 추가
  private ensureCategoryOrder(): void {
    let hasChanges = false;

    this.settings.categories.forEach((cat, index) => {
      if (typeof cat.order === "undefined") {
        cat.order = index;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.updatedAt = new Date();
    }
  }

  // Add new category
  addCategory(name: string, color: string): string {
    // 새 카테고리의 순서는 기존 카테고리 수
    const maxOrder =
      this.settings.categories.length > 0
        ? Math.max(...this.settings.categories.map((cat) => cat.order || 0))
        : -1;

    const newCategory: UserCategoryData = {
      id: uuidv4(),
      name,
      color,
      createdAt: new Date(),
      order: maxOrder + 1,
    };

    this.settings.categories.push(newCategory);
    this.settings.categoryFilter[newCategory.id] = true;
    this.updatedAt = new Date();

    return newCategory.id;
  }

  // Update category
  updateCategory(
    categoryId: string,
    updates: Partial<Pick<UserCategoryData, "name" | "color">>,
  ): boolean {
    const categoryIndex = this.settings.categories.findIndex(
      (cat) => cat.id === categoryId,
    );
    if (categoryIndex === -1) return false;

    const category = this.settings.categories[categoryIndex];

    if (updates.name !== undefined) category.name = updates.name;
    if (updates.color !== undefined) category.color = updates.color;

    this.updatedAt = new Date();
    return true;
  }

  // Delete category (minimum 1 category must remain)
  deleteCategory(categoryId: string): boolean {
    const categoryIndex = this.settings.categories.findIndex(
      (cat) => cat.id === categoryId,
    );
    if (categoryIndex === -1) return false;

    // 최소 1개 카테고리는 유지해야 함
    if (this.settings.categories.length <= 1) {
      return false;
    }

    this.settings.categories.splice(categoryIndex, 1);
    delete this.settings.categoryFilter[categoryId];
    this.updatedAt = new Date();

    return true;
  }

  // Get category by ID
  getCategoryById(categoryId: string): UserCategoryData | null {
    this.ensureCategoryOrder(); // order 필드 migration
    return (
      this.settings.categories.find((cat) => cat.id === categoryId) || null
    );
  }

  // Update category filter
  updateCategoryFilter(categoryId: string, enabled: boolean): void {
    this.settings.categoryFilter[categoryId] = enabled;
    this.updatedAt = new Date();
  }

  // Get all available colors (allowing duplicates)
  getAvailableColors(): string[] {
    // Colors sorted by HSL hue for better visual organization
    const allColors = [
      "#ef4444", // Red (H: 0°)
      "#f97316", // Orange (H: 25°)
      "#eab308", // Yellow (H: 45°)
      "#22c55e", // Light Green (H: 142°)
      "#14b8a6", // Teal (H: 174°)
      "#0ea5e9", // Sky (H: 199°)
      "#3b82f6", // Blue (H: 221°)
      "#6366f1", // Indigo (H: 239°)
      "#8b5cf6", // Purple (H: 262°)
    ];
    return allColors; // Return all colors without filtering
  }

  // Reorder categories
  reorderCategories(categoryIds: string[]): boolean {
    // 먼저 order 필드 migration 수행
    this.ensureCategoryOrder();

    const currentCategories = this.settings.categories;

    // 전달된 ID 배열이 현재 카테고리와 일치하는지 확인
    if (categoryIds.length !== currentCategories.length) {
      return false;
    }

    // 중복 ID 검증
    const uniqueIds = new Set(categoryIds);
    if (uniqueIds.size !== categoryIds.length) {
      return false;
    }

    const hasAllIds = categoryIds.every((id) =>
      currentCategories.some((cat) => cat.id === id),
    );

    if (!hasAllIds) {
      return false;
    }

    // 새로운 순서로 카테고리 배열 재정렬
    const reorderedCategories = categoryIds.map((id, index) => {
      const category = currentCategories.find((cat) => cat.id === id)!;
      return {
        ...category,
        order: index,
      };
    });

    this.settings.categories = reorderedCategories;
    this.updatedAt = new Date();

    return true;
  }

  // Update entire settings
  updateSettings(newSettings: Partial<UserSettingsData>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.updatedAt = new Date();
  }

  // Static method to create default settings for new user
  static createDefault(userId: string): UserSettingsEntity {
    return new UserSettingsEntity({ userId });
  }
}
