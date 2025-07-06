import { useLocalStorage } from './useLocalStorage';
import { AppSettings, Category, UserInfo } from '@/types';

const defaultSettings: AppSettings = {
  // 사용자 정보
  userInfo: {
    name: '사용자',
    email: 'user@example.com',
    profileImage: undefined
  },
  
  // 카테고리 관리
  categories: [
    { id: '1', name: '일반', color: '#3B82F6', isDefault: true },
    { id: '2', name: '업무', color: '#EF4444', isDefault: false },
    { id: '3', name: '개인', color: '#10B981', isDefault: false }
  ],
  
  // 보기 설정
  theme: 'light',
  language: 'ko',
  themeColor: '#3B82F6',
  customColor: '#3B82F6',
  defaultView: 'month',
  
  // 캘린더 설정
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  timezone: 'Asia/Seoul',
  weekStart: 'sunday',
  
  // 할 일 설정
  oldTodoDisplayLimit: 14,
  autoMoveTodos: true,
  saturationAdjustment: {
    enabled: true,
    levels: [
      { days: 1, opacity: 0.9 },
      { days: 3, opacity: 0.7 },
      { days: 7, opacity: 0.5 },
      { days: 14, opacity: 0.3 },
      { days: 30, opacity: 0.1 }
    ]
  },
  completedTodoDisplay: 'yesterday',
  
  // 기존 설정 (호환성 유지)
  showWeekends: true,
  autoBackup: false,
  backupInterval: 'weekly'
};

// 기존 설정 데이터 마이그레이션 함수
const migrateSettings = (oldSettings: unknown): AppSettings => {
  // 기존 설정이 새로운 구조를 이미 가지고 있다면 그대로 반환
  if (oldSettings && oldSettings.userInfo && oldSettings.categories) {
    return oldSettings as AppSettings;
  }
  
  // 기존 설정이 있다면 새로운 구조로 마이그레이션
  const migratedSettings: AppSettings = {
    ...defaultSettings,
    // 기존 설정이 있는 경우 해당 값들을 유지
    ...(oldSettings && {
      theme: oldSettings.theme || defaultSettings.theme,
      language: oldSettings.language || defaultSettings.language,
      dateFormat: oldSettings.dateFormat || defaultSettings.dateFormat,
      timeFormat: oldSettings.timeFormat || defaultSettings.timeFormat,
      weekStart: oldSettings.weekStart || defaultSettings.weekStart,
      defaultView: oldSettings.defaultView || defaultSettings.defaultView,
      showWeekends: oldSettings.showWeekends !== undefined ? oldSettings.showWeekends : defaultSettings.showWeekends,
      autoBackup: oldSettings.autoBackup !== undefined ? oldSettings.autoBackup : defaultSettings.autoBackup,
      backupInterval: oldSettings.backupInterval || defaultSettings.backupInterval,
    })
  };
  
  return migratedSettings;
};

export const useSettings = () => {
  const [rawSettings, setRawSettings] = useLocalStorage<unknown>('app-settings', defaultSettings);
  
  // 마이그레이션된 설정 사용
  const settings = migrateSettings(rawSettings);
  
  const setSettings = (newSettings: AppSettings) => {
    setRawSettings(newSettings);
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const currentSettings = migrateSettings(rawSettings);
    setSettings({
      ...currentSettings,
      [key]: value
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  // 카테고리 관리 함수들
  const addCategory = (name: string, color: string) => {
    const currentSettings = migrateSettings(rawSettings);
    const newCategory = {
      id: Date.now().toString(),
      name,
      color,
      isDefault: false
    };
    setSettings({
      ...currentSettings,
      categories: [...currentSettings.categories, newCategory]
    });
  };

  const removeCategory = (id: string) => {
    const currentSettings = migrateSettings(rawSettings);
    setSettings({
      ...currentSettings,
      categories: currentSettings.categories.filter(cat => cat.id !== id && !cat.isDefault)
    });
  };

  const updateCategory = (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    const currentSettings = migrateSettings(rawSettings);
    setSettings({
      ...currentSettings,
      categories: currentSettings.categories.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      )
    });
  };

  const setDefaultCategory = (id: string) => {
    const currentSettings = migrateSettings(rawSettings);
    setSettings({
      ...currentSettings,
      categories: currentSettings.categories.map(cat => ({
        ...cat,
        isDefault: cat.id === id
      }))
    });
  };

  // 사용자 정보 업데이트
  const updateUserInfo = (updates: Partial<UserInfo>) => {
    const currentSettings = migrateSettings(rawSettings);
    setSettings({
      ...currentSettings,
      userInfo: { ...currentSettings.userInfo, ...updates }
    });
  };

  return {
    settings,
    updateSetting,
    resetSettings,
    setSettings,
    // 카테고리 관리
    addCategory,
    removeCategory,
    updateCategory,
    setDefaultCategory,
    // 사용자 정보
    updateUserInfo,
  };
};