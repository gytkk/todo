import { v4 as uuidv4 } from "uuid";
import { TodoCategory } from "@calendar-todo/shared-types";

export interface UserCategoryData {
  id: string;
  name: string;
  color: string;
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
        name: "개인",
        color: "#3b82f6",
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "회사",
        color: "#10b981",
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
      createdAt: cat.createdAt,
    }));
  }

  // Add new category
  addCategory(name: string, color: string): string {
    const newCategory: UserCategoryData = {
      id: uuidv4(),
      name,
      color,
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
      "#3b82f6", // Blue
      "#10b981", // Emerald
      "#f97316", // Orange
      "#ef4444", // Red
      "#8b5cf6", // Purple
      "#ec4899", // Pink
      "#0ea5e9", // Sky
      "#22c55e", // Green
      "#eab308", // Yellow
      "#6366f1", // Indigo
      "#f43f5e", // Rose
      "#14b8a6", // Teal
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
