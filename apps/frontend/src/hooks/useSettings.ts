import { useLocalStorage } from './useLocalStorage';
import { AppSettings } from '@/types';

const defaultSettings: AppSettings = {
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

export const useSettings = () => {
  const [settings, setSettings] = useLocalStorage<AppSettings>('app-settings', defaultSettings);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSetting,
    resetSettings,
    setSettings,
  };
};