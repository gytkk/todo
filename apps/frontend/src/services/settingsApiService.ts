import { AppSettings, UserSettingsData } from '@calendar-todo/shared-types';

export class SettingsApiService {
  private static instance: SettingsApiService;
  private readonly baseUrl = '/api/user-settings';

  static getInstance(): SettingsApiService {
    if (!SettingsApiService.instance) {
      SettingsApiService.instance = new SettingsApiService();
    }
    return SettingsApiService.instance;
  }

  /**
   * 백엔드에서 사용자 설정을 가져옵니다
   */
  async getUserSettings(): Promise<UserSettingsData> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user settings: ${response.statusText}`);
      }

      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  }

  /**
   * 백엔드에 사용자 설정을 업데이트합니다
   */
  async updateUserSettings(settingsUpdate: Partial<UserSettingsData>): Promise<UserSettingsData> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settingsUpdate),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user settings: ${response.statusText}`);
      }

      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * 사용자 설정을 기본값으로 초기화합니다
   */
  async resetUserSettings(): Promise<UserSettingsData> {
    try {
      const response = await fetch(`${this.baseUrl}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to reset user settings: ${response.statusText}`);
      }

      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('Error resetting user settings:', error);
      throw error;
    }
  }

  /**
   * 사용자 데이터를 내보냅니다
   */
  async exportUserData(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to export user data: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * 사용자 데이터를 가져옵니다
   */
  async importUserData(importData: Record<string, unknown>): Promise<UserSettingsData> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        throw new Error(`Failed to import user data: ${response.statusText}`);
      }

      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('Error importing user data:', error);
      throw error;
    }
  }

  /**
   * UserSettingsData를 AppSettings 형식으로 변환합니다
   */
  convertToAppSettings(userSettingsData: UserSettingsData): Partial<AppSettings> {
    return {
      // 사용자 정보는 별도 처리 (사용자 프로필 API에서 가져옴)
      // categories는 카테고리 서비스에서 처리
      
      // 보기 설정
      theme: userSettingsData.theme,
      language: userSettingsData.language as 'ko' | 'en',
      themeColor: userSettingsData.themeColor,
      customColor: userSettingsData.customColor,
      defaultView: userSettingsData.defaultView,

      // 캘린더 설정
      dateFormat: userSettingsData.dateFormat,
      timeFormat: userSettingsData.timeFormat,
      timezone: userSettingsData.timezone,
      weekStart: userSettingsData.weekStart,

      // 할 일 설정
      oldTodoDisplayLimit: userSettingsData.oldTodoDisplayLimit,
      autoMoveTodos: userSettingsData.autoMoveTodos,
      showTaskMoveNotifications: userSettingsData.showTaskMoveNotifications,
      saturationAdjustment: userSettingsData.saturationAdjustment,
      completedTodoDisplay: userSettingsData.completedTodoDisplay,

      // 기존 설정 (호환성 유지)
      showWeekends: userSettingsData.showWeekends,
      autoBackup: userSettingsData.autoBackup,
      backupInterval: userSettingsData.backupInterval,
    };
  }

  /**
   * AppSettings를 UserSettingsData 업데이트 형식으로 변환합니다
   */
  convertFromAppSettings(appSettings: Partial<AppSettings>): Partial<UserSettingsData> {
    const updateData: Partial<UserSettingsData> = {};

    // 보기 설정
    if (appSettings.theme !== undefined) updateData.theme = appSettings.theme;
    if (appSettings.language !== undefined) updateData.language = appSettings.language;
    if (appSettings.themeColor !== undefined) updateData.themeColor = appSettings.themeColor;
    if (appSettings.customColor !== undefined) updateData.customColor = appSettings.customColor;
    if (appSettings.defaultView !== undefined) updateData.defaultView = appSettings.defaultView;

    // 캘린더 설정
    if (appSettings.dateFormat !== undefined) updateData.dateFormat = appSettings.dateFormat;
    if (appSettings.timeFormat !== undefined) updateData.timeFormat = appSettings.timeFormat;
    if (appSettings.timezone !== undefined) updateData.timezone = appSettings.timezone;
    if (appSettings.weekStart !== undefined) updateData.weekStart = appSettings.weekStart;

    // 할 일 설정
    if (appSettings.oldTodoDisplayLimit !== undefined) updateData.oldTodoDisplayLimit = appSettings.oldTodoDisplayLimit;
    if (appSettings.autoMoveTodos !== undefined) updateData.autoMoveTodos = appSettings.autoMoveTodos;
    if (appSettings.showTaskMoveNotifications !== undefined) updateData.showTaskMoveNotifications = appSettings.showTaskMoveNotifications;
    if (appSettings.saturationAdjustment !== undefined) updateData.saturationAdjustment = appSettings.saturationAdjustment;
    if (appSettings.completedTodoDisplay !== undefined) updateData.completedTodoDisplay = appSettings.completedTodoDisplay;

    // 기존 설정 (호환성 유지)
    if (appSettings.showWeekends !== undefined) updateData.showWeekends = appSettings.showWeekends;
    if (appSettings.autoBackup !== undefined) updateData.autoBackup = appSettings.autoBackup;
    if (appSettings.backupInterval !== undefined) updateData.backupInterval = appSettings.backupInterval;

    return updateData;
  }
}