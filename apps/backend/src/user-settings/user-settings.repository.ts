import { Injectable } from "@nestjs/common";
import { UserSettingsEntity, UserSettingsData } from "./user-settings.entity";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class UserSettingsRepository {
  constructor(private readonly redisService: RedisService) {}

  async findByUserId(userId: string): Promise<UserSettingsEntity | null> {
    const settingsKey = this.redisService.generateKey("user-settings", userId);
    const settingsData = await this.redisService.get(settingsKey);

    if (!settingsData) {
      return null;
    }

    try {
      const parsedData = JSON.parse(settingsData) as {
        id: string;
        userId: string;
        createdAt: string;
        updatedAt: string;
        settings: {
          categories: Array<{
            id: string;
            name: string;
            color: string;
            createdAt: string;
            order?: number;
          }>;
          categoryFilter: { [categoryId: string]: boolean };
          theme: "light" | "dark" | "system";
          language: string;
          // 새로 추가된 필드들 (기존 데이터 호환성을 위해 optional)
          autoMoveTodos?: boolean;
          showTaskMoveNotifications?: boolean;
          completedTodoDisplay?: "all" | "yesterday" | "none";
          dateFormat?: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
          timeFormat?: "12h" | "24h";
          weekStart?: "sunday" | "monday" | "saturday";
          notifications?: {
            enabled: boolean;
            dailyReminder: boolean;
            weeklyReport: boolean;
          };
          autoBackup?: boolean;
          backupInterval?: "daily" | "weekly" | "monthly";
        };
      };
      // UserSettingsEntity 생성자에서 기본값 병합을 처리하므로
      // settings를 Partial로 전달해도 안전함
      return new UserSettingsEntity({
        ...parsedData,
        createdAt: new Date(parsedData.createdAt),
        updatedAt: new Date(parsedData.updatedAt),
        settings: {
          ...parsedData.settings,
          categories: parsedData.settings.categories.map((cat) => ({
            ...cat,
            createdAt: new Date(cat.createdAt),
          })),
        } as UserSettingsData,
      });
    } catch (error) {
      console.error("Error parsing user settings from Redis:", error);
      return null;
    }
  }

  async create(userSettings: UserSettingsEntity): Promise<UserSettingsEntity> {
    const settingsKey = this.redisService.generateKey(
      "user-settings",
      userSettings.userId,
    );
    const settingsListKey = this.redisService.generateKey(
      "user-settings",
      "list",
    );

    const settingsData = {
      ...userSettings,
      createdAt: userSettings.createdAt.toISOString(),
      updatedAt: userSettings.updatedAt.toISOString(),
      settings: {
        ...userSettings.settings,
        categories: userSettings.settings.categories.map((cat) => ({
          ...cat,
          createdAt: cat.createdAt.toISOString(),
        })),
      },
    };

    await this.redisService.set(settingsKey, JSON.stringify(settingsData));
    await this.redisService.zadd(
      settingsListKey,
      userSettings.createdAt.getTime(),
      userSettings.userId,
    );

    return userSettings;
  }

  async update(
    userId: string,
    userSettings: UserSettingsEntity,
  ): Promise<UserSettingsEntity | null> {
    const settingsKey = this.redisService.generateKey("user-settings", userId);
    const existingSettings = await this.findByUserId(userId);

    if (!existingSettings) {
      return null;
    }

    const settingsData = {
      ...userSettings,
      createdAt: userSettings.createdAt.toISOString(),
      updatedAt: userSettings.updatedAt.toISOString(),
      settings: {
        ...userSettings.settings,
        categories: userSettings.settings.categories.map((cat) => ({
          ...cat,
          createdAt: cat.createdAt.toISOString(),
        })),
      },
    };

    await this.redisService.set(settingsKey, JSON.stringify(settingsData));
    return userSettings;
  }

  async delete(userId: string): Promise<boolean> {
    const settingsKey = this.redisService.generateKey("user-settings", userId);
    const settingsListKey = this.redisService.generateKey(
      "user-settings",
      "list",
    );

    const result = await this.redisService.del(settingsKey);
    await this.redisService.zrem(settingsListKey, userId);

    return result > 0;
  }

  // Find or create user settings (helper method)
  async findOrCreate(userId: string): Promise<UserSettingsEntity> {
    let settings = await this.findByUserId(userId);

    if (!settings) {
      settings = UserSettingsEntity.createDefault(userId);
      await this.create(settings);
    }

    return settings;
  }
}
