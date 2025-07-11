import { v4 as uuidv4 } from "uuid";
import { TodoCategory } from "@calendar-todo/shared-types";

export interface UserCategoryData {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface UserSettingsData {
  categories: UserCategoryData[];
  categoryFilter: { [categoryId: string]: boolean };
  theme: "light" | "dark" | "system";
  language: string;
  // 필요시 다른 설정들 추가 가능
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
    this.settings = data.settings || this.getDefaultSettings();
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
    };
  }

  private createDefaultCategories(): UserCategoryData[] {
    return [
      {
        id: uuidv4(),
        name: "회사",
        color: "#3b82f6",
        isDefault: true,
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "가족",
        color: "#10b981",
        isDefault: true,
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "개인",
        color: "#f59e0b",
        isDefault: true,
        createdAt: new Date(),
      },
    ];
  }

  // Get categories as TodoCategory array for frontend
  getCategories(): TodoCategory[] {
    return this.settings.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      isDefault: cat.isDefault,
      createdAt: cat.createdAt,
    }));
  }

  // Add new category
  addCategory(name: string, color: string): string {
    const newCategory: UserCategoryData = {
      id: uuidv4(),
      name,
      color,
      isDefault: false,
      createdAt: new Date(),
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

    // Prevent updating default categories' core properties
    if (category.isDefault && updates.name !== undefined) {
      return false;
    }

    if (updates.name !== undefined) category.name = updates.name;
    if (updates.color !== undefined) category.color = updates.color;

    this.updatedAt = new Date();
    return true;
  }

  // Delete category (non-default only)
  deleteCategory(categoryId: string): boolean {
    const categoryIndex = this.settings.categories.findIndex(
      (cat) => cat.id === categoryId,
    );
    if (categoryIndex === -1) return false;

    const category = this.settings.categories[categoryIndex];
    if (category.isDefault) return false;

    this.settings.categories.splice(categoryIndex, 1);
    delete this.settings.categoryFilter[categoryId];
    this.updatedAt = new Date();

    return true;
  }

  // Get category by ID
  getCategoryById(categoryId: string): UserCategoryData | null {
    return (
      this.settings.categories.find((cat) => cat.id === categoryId) || null
    );
  }

  // Update category filter
  updateCategoryFilter(categoryId: string, enabled: boolean): void {
    this.settings.categoryFilter[categoryId] = enabled;
    this.updatedAt = new Date();
  }

  // Get available colors (not used by existing categories)
  getAvailableColors(): string[] {
    const usedColors = this.settings.categories.map((cat) => cat.color);
    const allColors = [
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#84cc16",
      "#f97316",
      "#ec4899",
      "#64748b",
      "#059669",
    ];
    return allColors.filter((color) => !usedColors.includes(color));
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
