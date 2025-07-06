import { AppSettings } from '@/types';
import { safeLocalStorageGet, safeLocalStorageSet } from '@/utils/errorHandler';

export class SettingsService {
  private static instance: SettingsService;
  private readonly STORAGE_KEY = 'app-settings';
  
  private readonly defaultSettings: AppSettings = {
    theme: 'light',
    language: 'ko',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    weekStart: 'sunday',
    defaultView: 'month',
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

  private validateSettings(settings: any): AppSettings {
    const validThemes = ['light', 'dark', 'system'];
    const validLanguages = ['ko', 'en'];
    const validDateFormats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'];
    const validTimeFormats = ['12h', '24h'];
    const validWeekStarts = ['sunday', 'monday', 'saturday'];
    const validDefaultViews = ['month', 'week', 'day'];
    const validBackupIntervals = ['daily', 'weekly', 'monthly'];

    return {
      theme: validThemes.includes(settings.theme) ? settings.theme : this.defaultSettings.theme,
      language: validLanguages.includes(settings.language) ? settings.language : this.defaultSettings.language,
      dateFormat: validDateFormats.includes(settings.dateFormat) ? settings.dateFormat : this.defaultSettings.dateFormat,
      timeFormat: validTimeFormats.includes(settings.timeFormat) ? settings.timeFormat : this.defaultSettings.timeFormat,
      weekStart: validWeekStarts.includes(settings.weekStart) ? settings.weekStart : this.defaultSettings.weekStart,
      defaultView: validDefaultViews.includes(settings.defaultView) ? settings.defaultView : this.defaultSettings.defaultView,
      showWeekends: typeof settings.showWeekends === 'boolean' ? settings.showWeekends : this.defaultSettings.showWeekends,
      autoBackup: typeof settings.autoBackup === 'boolean' ? settings.autoBackup : this.defaultSettings.autoBackup,
      backupInterval: validBackupIntervals.includes(settings.backupInterval) ? settings.backupInterval : this.defaultSettings.backupInterval,
    };
  }
}