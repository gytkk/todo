import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { UserSettingsRepository } from "./user-settings.repository";
import { UserSettingsData, UserSettingsEntity } from "./user-settings.entity";

export interface ExportData {
  version: string;
  exportDate: string;
  userId: string;
  settings: UserSettingsData;
}

export interface ImportData {
  version?: string;
  exportDate?: string;
  userId?: string;
  settings: Record<string, unknown>;
}
import { TodoCategory } from "@calendar-todo/shared-types";

@Injectable()
export class UserSettingsService {
  constructor(
    private readonly userSettingsRepository: UserSettingsRepository,
  ) {}

  // Get user settings (creates default if not exists)
  async getUserSettings(userId: string): Promise<UserSettingsData> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);
    return settings.settings;
  }

  // Update user settings
  async updateUserSettings(
    userId: string,
    updates: Partial<UserSettingsData>,
  ): Promise<UserSettingsData> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);
    settings.updateSettings(updates);

    await this.userSettingsRepository.update(userId, settings);
    return settings.settings;
  }

  // Get user categories
  async getUserCategories(userId: string): Promise<TodoCategory[]> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);

    // Check if migration is needed before getting categories
    const needsMigration = settings.settings.categories.some(
      (cat) => typeof cat.order === "undefined",
    );

    const categories = settings.getCategories();

    // Save migration if it was applied
    if (needsMigration) {
      await this.userSettingsRepository.update(userId, settings);
    }

    return categories;
  }

  // Add new category
  async addCategory(
    userId: string,
    name: string,
    color: string,
  ): Promise<TodoCategory> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);

    // Check if category name already exists
    const existingCategories = settings.getCategories();
    if (existingCategories.some((cat) => cat.name === name)) {
      throw new BadRequestException("Category name already exists");
    }

    // Allow duplicate colors - removed color uniqueness check

    // Check category limit (max 11: 3 default + 8 custom)
    if (existingCategories.length >= 11) {
      throw new BadRequestException(
        "Maximum number of categories reached (11)",
      );
    }

    const newCategoryId = settings.addCategory(name, color);
    await this.userSettingsRepository.update(userId, settings);

    const newCategory = settings.getCategoryById(newCategoryId);
    return {
      id: newCategory!.id,
      name: newCategory!.name,
      color: newCategory!.color,
      createdAt: newCategory!.createdAt,
      order: newCategory!.order || 0,
    };
  }

  // Update category
  async updateCategory(
    userId: string,
    categoryId: string,
    updates: Partial<Pick<TodoCategory, "name" | "color">>,
  ): Promise<TodoCategory> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);

    // Check if category exists
    const category = settings.getCategoryById(categoryId);
    if (!category) {
      throw new NotFoundException("Category not found");
    }

    // Check if new name already exists (if updating name)
    if (updates.name && updates.name !== category.name) {
      const existingCategories = settings.getCategories();
      if (
        existingCategories.some(
          (cat) => cat.name === updates.name && cat.id !== categoryId,
        )
      ) {
        throw new BadRequestException("Category name already exists");
      }
    }

    // Allow duplicate colors - removed color uniqueness check for updates

    const success = settings.updateCategory(categoryId, updates);
    if (!success) {
      throw new BadRequestException("Failed to update category");
    }

    await this.userSettingsRepository.update(userId, settings);

    const updatedCategory = settings.getCategoryById(categoryId);
    return {
      id: updatedCategory!.id,
      name: updatedCategory!.name,
      color: updatedCategory!.color,
      createdAt: updatedCategory!.createdAt,
      order: updatedCategory!.order || 0,
    };
  }

  // Delete category
  async deleteCategory(
    userId: string,
    categoryId: string,
  ): Promise<{ success: boolean; deletedId: string }> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);

    const category = settings.getCategoryById(categoryId);
    if (!category) {
      throw new NotFoundException("Category not found");
    }

    const success = settings.deleteCategory(categoryId);
    if (!success) {
      throw new BadRequestException(
        "Cannot delete the last category. At least one category must remain.",
      );
    }

    await this.userSettingsRepository.update(userId, settings);

    return { success: true, deletedId: categoryId };
  }

  // Get available colors
  async getAvailableColors(userId: string): Promise<string[]> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);
    return settings.getAvailableColors();
  }

  // Get category by ID
  async getCategoryById(
    userId: string,
    categoryId: string,
  ): Promise<TodoCategory | null> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);
    const category = settings.getCategoryById(categoryId);

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      createdAt: category.createdAt,
      order: category.order || 0,
    };
  }

  // Update category filter
  async updateCategoryFilter(
    userId: string,
    categoryId: string,
    enabled: boolean,
  ): Promise<void> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);
    settings.updateCategoryFilter(categoryId, enabled);
    await this.userSettingsRepository.update(userId, settings);
  }

  // Get category filter
  async getCategoryFilter(
    userId: string,
  ): Promise<{ [categoryId: string]: boolean }> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);
    return settings.settings.categoryFilter;
  }

  // Reorder categories
  async reorderCategories(
    userId: string,
    categoryIds: string[],
  ): Promise<TodoCategory[]> {
    const settings = await this.userSettingsRepository.findOrCreate(userId);

    const success = settings.reorderCategories(categoryIds);
    if (!success) {
      throw new BadRequestException("Invalid category order provided");
    }

    await this.userSettingsRepository.update(userId, settings);

    // 업데이트된 카테고리 목록 반환
    return settings.getCategories();
  }

  async resetUserSettings(userId: string): Promise<UserSettingsData> {
    // 기본 설정으로 완전히 초기화
    const defaultEntity = new UserSettingsEntity({ userId });
    await this.userSettingsRepository.create(defaultEntity);
    return defaultEntity.settings;
  }

  async exportUserData(userId: string): Promise<ExportData> {
    // 사용자의 모든 설정 데이터를 내보내기
    const userSettings = await this.userSettingsRepository.findByUserId(userId);
    if (!userSettings) {
      throw new NotFoundException("User settings not found");
    }

    return {
      version: "1.0",
      exportDate: new Date().toISOString(),
      userId: userId,
      settings: userSettings.settings,
    };
  }

  async importUserData(
    userId: string,
    importData: ImportData,
  ): Promise<UserSettingsData> {
    // 데이터 유효성 검사
    if (!importData || !importData.settings) {
      throw new BadRequestException("Invalid import data format");
    }

    // 기존 설정 가져오기 또는 새로 생성
    let userSettings = await this.userSettingsRepository.findByUserId(userId);
    if (!userSettings) {
      userSettings = new UserSettingsEntity({ userId });
    }

    // 가져온 데이터로 설정 업데이트 (기본값과 병합)
    const updatedEntity = new UserSettingsEntity({
      ...userSettings,
      settings: importData.settings as unknown as UserSettingsData,
    });

    await this.userSettingsRepository.update(userId, updatedEntity);
    return updatedEntity.settings;
  }
}
