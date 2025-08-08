import { UserSettings, Theme, Prisma } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { BasePostgresRepository } from '../base-postgres.repository';

export interface CreateUserSettingsDto {
  userId: string;
  theme?: Theme;
  language?: string;
  themeColor?: string;
  customColor?: string;
  defaultView?: string;
  dateFormat?: string;
  timeFormat?: string;
  timezone?: string;
  weekStart?: string;
  oldTodoDisplayLimit?: number;
  autoMoveTodos?: boolean;
  showTaskMoveNotifications?: boolean;
  saturationEnabled?: boolean;
  saturationLevels?: any; // JSON type
  completedTodoDisplay?: string;
  showWeekends?: boolean;
  autoBackup?: boolean;
  backupInterval?: string;
}

export class UserSettingsPostgresRepository extends BasePostgresRepository<UserSettings> {
  protected tableName = 'user_settings';

  constructor(app: FastifyInstance) {
    super(app);
  }

  async findById(id: string): Promise<UserSettings | null> {
    try {
      return await this.prisma.userSettings.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error finding user settings by id:', error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    try {
      return await this.prisma.userSettings.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error('Error finding user settings by user id:', error);
      return null;
    }
  }

  async findAll(): Promise<UserSettings[]> {
    try {
      return await this.prisma.userSettings.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error finding all user settings:', error);
      return [];
    }
  }

  async findByIds(ids: string[]): Promise<UserSettings[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      return await this.prisma.userSettings.findMany({
        where: {
          id: { in: ids },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error finding user settings by ids:', error);
      return [];
    }
  }

  async create(settingsData: CreateUserSettingsDto): Promise<UserSettings> {
    try {
      return await this.prisma.userSettings.create({
        data: {
          userId: settingsData.userId,
          theme: settingsData.theme ?? Theme.SYSTEM,
          language: settingsData.language ?? 'ko',
          themeColor: settingsData.themeColor ?? '#3b82f6',
          customColor: settingsData.customColor ?? '#3b82f6',
          defaultView: settingsData.defaultView ?? 'month',
          dateFormat: settingsData.dateFormat ?? 'YYYY-MM-DD',
          timeFormat: settingsData.timeFormat ?? '24h',
          timezone: settingsData.timezone ?? 'Asia/Seoul',
          weekStart: settingsData.weekStart ?? 'sunday',
          oldTodoDisplayLimit: settingsData.oldTodoDisplayLimit ?? 30,
          autoMoveTodos: settingsData.autoMoveTodos ?? true,
          showTaskMoveNotifications: settingsData.showTaskMoveNotifications ?? true,
          saturationEnabled: settingsData.saturationEnabled ?? true,
          saturationLevels: settingsData.saturationLevels ?? [
            { days: 7, opacity: 1.0 },
            { days: 14, opacity: 0.8 },
            { days: 30, opacity: 0.6 },
          ],
          completedTodoDisplay: settingsData.completedTodoDisplay ?? 'all',
          showWeekends: settingsData.showWeekends ?? true,
          autoBackup: settingsData.autoBackup ?? false,
          backupInterval: settingsData.backupInterval ?? 'weekly',
        },
      });
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw new Error('Failed to create user settings');
    }
  }

  async update(id: string, updates: Partial<UserSettings>): Promise<UserSettings | null> {
    try {
      // Remove fields that shouldn't be updated
      const { id: _, userId: __, createdAt: ___, updatedAt: ____, ...data } = updates;
      return await this.prisma.userSettings.update({
        where: { id },
        data: data as Prisma.UserSettingsUpdateInput,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          return null;
        }
      }
      console.error('Error updating user settings:', error);
      throw new Error('Failed to update user settings');
    }
  }

  async updateByUserId(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | null> {
    try {
      // Remove fields that shouldn't be updated
      const { id: _, userId: __, createdAt: ___, updatedAt: ____, ...data } = updates;
      return await this.prisma.userSettings.update({
        where: { userId },
        data: data as Prisma.UserSettingsUpdateInput,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found - create default settings
          return await this.create({ userId } as CreateUserSettingsDto);
        }
      }
      console.error('Error updating user settings by user id:', error);
      throw new Error('Failed to update user settings');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.userSettings.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          return false;
        }
      }
      console.error('Error deleting user settings:', error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const settings = await this.prisma.userSettings.findUnique({
        where: { id },
        select: { id: true },
      });
      return settings !== null;
    } catch (error) {
      console.error('Error checking user settings existence:', error);
      return false;
    }
  }

  async existsByUserId(userId: string): Promise<boolean> {
    try {
      const settings = await this.prisma.userSettings.findUnique({
        where: { userId },
        select: { id: true },
      });
      return settings !== null;
    } catch (error) {
      console.error('Error checking user settings existence by user id:', error);
      return false;
    }
  }

  async getOrCreateByUserId(userId: string): Promise<UserSettings> {
    try {
      let settings = await this.findByUserId(userId);
      
      if (!settings) {
        settings = await this.create({ userId });
      }
      
      return settings;
    } catch (error) {
      console.error('Error getting or creating user settings:', error);
      throw new Error('Failed to get or create user settings');
    }
  }

  async resetToDefaults(userId: string): Promise<UserSettings | null> {
    try {
      const defaultSettings: CreateUserSettingsDto = {
        userId,
        theme: Theme.SYSTEM,
        language: 'ko',
        themeColor: '#3b82f6',
        customColor: '#3b82f6',
        defaultView: 'month',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        timezone: 'Asia/Seoul',
        weekStart: 'sunday',
        oldTodoDisplayLimit: 30,
        autoMoveTodos: true,
        showTaskMoveNotifications: true,
        saturationEnabled: true,
        saturationLevels: [
          { days: 7, opacity: 1.0 },
          { days: 14, opacity: 0.8 },
          { days: 30, opacity: 0.6 },
        ],
        completedTodoDisplay: 'all',
        showWeekends: true,
        autoBackup: false,
        backupInterval: 'weekly',
      };

      return await this.updateByUserId(userId, defaultSettings);
    } catch (error) {
      console.error('Error resetting user settings to defaults:', error);
      return null;
    }
  }

  protected async count(where?: Prisma.UserSettingsWhereInput): Promise<number> {
    try {
      return await this.prisma.userSettings.count({ where });
    } catch (error) {
      console.error('Error counting user settings:', error);
      return 0;
    }
  }
}