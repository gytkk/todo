import { AppSettings } from '@calendar-todo/shared-types';
import { safeLocalStorageGet, safeLocalStorageSet } from '@/utils/errorHandler';

export class SettingsService {
  private static instance: SettingsService;
  private readonly STORAGE_KEY = 'app-settings';
  
  private readonly defaultSettings: AppSettings = {
    userInfo: {
      name: '',
      email: '',
      profileImage: ''
    },
    categories: [],
    theme: 'light',
    language: 'ko',
    themeColor: '#3b82f6',
    customColor: '#3b82f6',
    defaultView: 'month',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    timezone: 'Asia/Seoul',
    weekStart: 'sunday',
    oldTodoDisplayLimit: 7,
    autoMoveTodos: false,
    saturationAdjustment: {
      enabled: false,
      levels: [
        { days: 3, opacity: 0.8 },
        { days: 7, opacity: 0.6 },
        { days: 14, opacity: 0.4 }
      ]
    },
    completedTodoDisplay: 'all',
    showWeekends: true,
    autoBackup: false,
    backupInterval: 'weekly'
  };

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  async getSettings(): Promise<AppSettings> {
    try {
      const savedSettings = safeLocalStorageGet(this.STORAGE_KEY, this.defaultSettings);
      
      // Validate settings structure
      return this.validateSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.defaultSettings;
    }
  }

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      const validatedSettings = this.validateSettings(settings);
      return safeLocalStorageSet(this.STORAGE_KEY, validatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  async updateSetting<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, [key]: value };
      return await this.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  }

  async resetSettings(): Promise<boolean> {
    try {
      return safeLocalStorageSet(this.STORAGE_KEY, this.defaultSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }

  async exportSettings(): Promise<Blob> {
    try {
      const settings = await this.getSettings();
      const dataStr = JSON.stringify(settings, null, 2);
      return new Blob([dataStr], { type: 'application/json' });
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  async importSettings(file: File): Promise<AppSettings> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          const validatedSettings = this.validateSettings(importedData);
          
          const success = await this.saveSettings(validatedSettings);
          if (!success) {
            throw new Error('Failed to save imported settings');
          }
          
          resolve(validatedSettings);
        } catch (error) {
          reject(new Error('Failed to import settings: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private validateSettings(settings: unknown): AppSettings {
    const validThemes = ['light', 'dark', 'system'];
    const validLanguages = ['ko', 'en'];
    const validDateFormats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'];
    const validTimeFormats = ['12h', '24h'];
    const validWeekStarts = ['sunday', 'monday', 'saturday'];
    const validDefaultViews = ['month', 'week', 'day'];
    const validBackupIntervals = ['daily', 'weekly', 'monthly'];

    const validatedSettings = { ...this.defaultSettings };
    
    const settingsObj = settings as Record<string, unknown>;
    
    if (validThemes.includes(settingsObj.theme as string)) {
      validatedSettings.theme = settingsObj.theme as AppSettings['theme'];
    }
    if (validLanguages.includes(settingsObj.language as string)) {
      validatedSettings.language = settingsObj.language as AppSettings['language'];
    }
    if (validDateFormats.includes(settingsObj.dateFormat as string)) {
      validatedSettings.dateFormat = settingsObj.dateFormat as AppSettings['dateFormat'];
    }
    if (validTimeFormats.includes(settingsObj.timeFormat as string)) {
      validatedSettings.timeFormat = settingsObj.timeFormat as AppSettings['timeFormat'];
    }
    if (validWeekStarts.includes(settingsObj.weekStart as string)) {
      validatedSettings.weekStart = settingsObj.weekStart as AppSettings['weekStart'];
    }
    if (validDefaultViews.includes(settingsObj.defaultView as string)) {
      validatedSettings.defaultView = settingsObj.defaultView as AppSettings['defaultView'];
    }
    if (typeof settingsObj.showWeekends === 'boolean') {
      validatedSettings.showWeekends = settingsObj.showWeekends;
    }
    if (typeof settingsObj.autoBackup === 'boolean') {
      validatedSettings.autoBackup = settingsObj.autoBackup;
    }
    if (validBackupIntervals.includes(settingsObj.backupInterval as string)) {
      validatedSettings.backupInterval = settingsObj.backupInterval as AppSettings['backupInterval'];
    }
    
    return validatedSettings;
  }
}