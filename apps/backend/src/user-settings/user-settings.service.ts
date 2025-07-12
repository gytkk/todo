import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { UserSettingsRepository } from "./user-settings.repository";
import { UserSettingsData } from "./user-settings.entity";
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
    return settings.getCategories();
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

    // Check if color is already used
    if (existingCategories.some((cat) => cat.color === color)) {
      throw new BadRequestException(
        "Color is already used by another category",
      );
    }

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

    // Check if new color is already used (if updating color)
    if (updates.color && updates.color !== category.color) {
      const existingCategories = settings.getCategories();
      if (
        existingCategories.some(
          (cat) => cat.color === updates.color && cat.id !== categoryId,
        )
      ) {
        throw new BadRequestException(
          "Color is already used by another category",
        );
      }
    }

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
}
