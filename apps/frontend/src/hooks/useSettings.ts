import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { AppSettings, Category, UserInfo, UserSettingsData } from '@calendar-todo/shared-types';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsApiService } from '@/services/settingsApiService';
import { UserApiService } from '@/services/userApiService';

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
  showTaskMoveNotifications: true, // 작업 이동 알림 기본값: 활성화
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
  if (oldSettings && typeof oldSettings === 'object' && 'userInfo' in oldSettings && 'categories' in oldSettings) {
    return oldSettings as AppSettings;
  }
  
  // 기존 설정이 있다면 새로운 구조로 마이그레이션
  const migratedSettings: AppSettings = { ...defaultSettings };
  
  if (oldSettings && typeof oldSettings === 'object') {
    const old = oldSettings as Record<string, unknown>;
    if (old.theme) migratedSettings.theme = old.theme as AppSettings['theme'];
    if (old.language) migratedSettings.language = old.language as AppSettings['language'];
    if (old.dateFormat) migratedSettings.dateFormat = old.dateFormat as AppSettings['dateFormat'];
    if (old.timeFormat) migratedSettings.timeFormat = old.timeFormat as AppSettings['timeFormat'];
    if (old.weekStart) migratedSettings.weekStart = old.weekStart as AppSettings['weekStart'];
    if (old.defaultView) migratedSettings.defaultView = old.defaultView as AppSettings['defaultView'];
    if (old.showWeekends !== undefined) migratedSettings.showWeekends = old.showWeekends as boolean;
    if (old.autoBackup !== undefined) migratedSettings.autoBackup = old.autoBackup as boolean;
    if (old.backupInterval) migratedSettings.backupInterval = old.backupInterval as AppSettings['backupInterval'];
  }
  
  return migratedSettings;
};

export const useSettings = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [rawSettings, setRawSettings] = useLocalStorage<unknown>('app-settings', defaultSettings);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const settingsApiService = SettingsApiService.getInstance();
  const userApiService = UserApiService.getInstance();

  // 저장된 사용자 설정 로드 헬퍼 함수 (로그인 시 받은 데이터)
  const getStoredUserSettings = useCallback((): UserSettingsData | null => {
    try {
      const settingsData = localStorage.getItem('user_settings') || sessionStorage.getItem('user_settings');
      return settingsData ? JSON.parse(settingsData) : null;
    } catch (error) {
      console.error('Failed to parse stored user settings:', error);
      return null;
    }
  }, []);

  // 설정 초기화 및 로드
  const initializeSettings = useCallback(async () => {
    if (authLoading || initialized) return;

    setLoading(true);
    try {
      if (!isAuthenticated) {
        // 미인증 사용자: localStorage의 설정 사용
        const migratedSettings = migrateSettings(rawSettings);
        setSettings(migratedSettings);
      } else {
        // 인증된 사용자: 먼저 저장된 설정 확인 (로그인 시 받은 데이터)
        const storedSettings = getStoredUserSettings();
        if (storedSettings) {
          // 저장된 설정에서 AppSettings 구조로 변환
          const apiSettings = settingsApiService.convertToAppSettings(storedSettings);
          const migratedLocalSettings = migrateSettings(rawSettings);
          
          const combinedSettings: AppSettings = {
            ...migratedLocalSettings,
            ...apiSettings,
            // 카테고리는 별도 처리 (useCategories에서 관리)
            categories: migratedLocalSettings.categories,
          };

          setSettings(combinedSettings);
        } else {
          // 저장된 설정이 없으면 API에서 로드
          try {
            const userSettingsData = await settingsApiService.getUserSettings();
            const apiSettings = settingsApiService.convertToAppSettings(userSettingsData);
            const migratedLocalSettings = migrateSettings(rawSettings);
            
            const combinedSettings: AppSettings = {
              ...migratedLocalSettings,
              ...apiSettings,
              categories: migratedLocalSettings.categories,
            };

            setSettings(combinedSettings);
          } catch (error) {
            console.error('Failed to load settings from API, using local settings:', error);
            const migratedSettings = migrateSettings(rawSettings);
            setSettings(migratedSettings);
          }
        }
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [isAuthenticated, authLoading, rawSettings, initialized, getStoredUserSettings, settingsApiService]);

  // 인증 상태 변경 시 설정 초기화
  useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    
    // 로컬 상태 즉시 업데이트
    setSettings(newSettings);
    
    if (!isAuthenticated) {
      // 미인증 사용자: localStorage에만 저장
      setRawSettings(newSettings);
    } else {
      // 인증된 사용자: 백엔드 API에 동기화
      try {
        const settingsUpdate = settingsApiService.convertFromAppSettings({ [key]: value });
        await settingsApiService.updateUserSettings(settingsUpdate);
        
        // localStorage도 업데이트 (캐시 역할)
        setRawSettings(newSettings);
      } catch (error) {
        console.error('Failed to sync setting to backend:', error);
        // 백엔드 동기화 실패 시 로컬에만 저장
        setRawSettings(newSettings);
      }
    }
  }, [settings, isAuthenticated, setRawSettings, settingsApiService]);

  const resetSettings = useCallback(async () => {
    if (!isAuthenticated) {
      // 미인증 사용자: 로컬 기본값으로 리셋
      setSettings(defaultSettings);
      setRawSettings(defaultSettings);
    } else {
      // 인증된 사용자: 백엔드에서 리셋
      try {
        const resetSettingsData = await settingsApiService.resetUserSettings();
        const apiSettings = settingsApiService.convertToAppSettings(resetSettingsData);
        const newSettings: AppSettings = {
          ...defaultSettings,
          ...apiSettings,
        };
        
        setSettings(newSettings);
        setRawSettings(newSettings);
      } catch (error) {
        console.error('Failed to reset settings on backend:', error);
        // 백엔드 리셋 실패 시 로컬에서만 리셋
        setSettings(defaultSettings);
        setRawSettings(defaultSettings);
      }
    }
  }, [isAuthenticated, setRawSettings, settingsApiService]);

  // 사용자 정보 업데이트 (백엔드 API 사용)
  const updateUserInfo = useCallback(async (updates: Partial<UserInfo>) => {
    if (!isAuthenticated) {
      // 미인증 사용자: 로컬에만 업데이트
      const newSettings = {
        ...settings,
        userInfo: { ...settings.userInfo, ...updates }
      };
      setSettings(newSettings);
      setRawSettings(newSettings);
      return;
    }

    try {
      // 백엔드 사용자 프로필 업데이트
      const updatedUserInfo = await userApiService.updateUserProfile({
        name: updates.name,
      });
      
      const newSettings = {
        ...settings,
        userInfo: updatedUserInfo
      };
      
      setSettings(newSettings);
      setRawSettings(newSettings);
    } catch (error) {
      console.error('Failed to update user info:', error);
      throw error;
    }
  }, [settings, isAuthenticated, setRawSettings, userApiService]);

  // 비밀번호 변경 (백엔드 API 사용)
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      await userApiService.changePassword({
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }, [isAuthenticated, userApiService]);

  // 데이터 내보내기
  const exportData = useCallback(async (): Promise<Blob> => {
    if (!isAuthenticated) {
      // 미인증 사용자: 로컬 설정만 내보내기
      const dataStr = JSON.stringify(settings, null, 2);
      return new Blob([dataStr], { type: 'application/json' });
    }

    try {
      const exportedData = await settingsApiService.exportUserData();
      const dataStr = JSON.stringify(exportedData, null, 2);
      return new Blob([dataStr], { type: 'application/json' });
    } catch (error) {
      console.error('Failed to export data from backend:', error);
      // 백엔드 실패 시 로컬 데이터 내보내기
      const dataStr = JSON.stringify(settings, null, 2);
      return new Blob([dataStr], { type: 'application/json' });
    }
  }, [isAuthenticated, settings, settingsApiService]);

  // 데이터 가져오기
  const importData = useCallback(async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          if (!isAuthenticated) {
            // 미인증 사용자: 로컬에만 적용
            const validatedSettings = migrateSettings(importedData);
            setSettings(validatedSettings);
            setRawSettings(validatedSettings);
          } else {
            // 인증된 사용자: 백엔드에 가져오기
            const importedSettingsData = await settingsApiService.importUserData(importedData);
            const apiSettings = settingsApiService.convertToAppSettings(importedSettingsData);
            const newSettings: AppSettings = {
              ...defaultSettings,
              ...apiSettings,
            };
            
            setSettings(newSettings);
            setRawSettings(newSettings);
          }
          
          resolve();
        } catch (error) {
          reject(new Error('Failed to import settings: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [isAuthenticated, setRawSettings, settingsApiService]);

  // 레거시 카테고리 관리 함수들 (하위 호환성을 위해 유지, 실제로는 useCategories 사용 권장)
  const addCategory = useCallback((name: string, color: string) => {
    const newCategory = {
      id: Date.now().toString(),
      name,
      color,
      isDefault: false
    };
    const newSettings = {
      ...settings,
      categories: [...settings.categories, newCategory]
    };
    setSettings(newSettings);
    setRawSettings(newSettings);
  }, [settings, setRawSettings]);

  const removeCategory = useCallback((id: string) => {
    const newSettings = {
      ...settings,
      categories: settings.categories.filter(cat => cat.id !== id && !cat.isDefault)
    };
    setSettings(newSettings);
    setRawSettings(newSettings);
  }, [settings, setRawSettings]);

  const updateCategory = useCallback((id: string, updates: Partial<Omit<Category, 'id'>>) => {
    const newSettings = {
      ...settings,
      categories: settings.categories.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      )
    };
    setSettings(newSettings);
    setRawSettings(newSettings);
  }, [settings, setRawSettings]);

  const setDefaultCategory = useCallback((id: string) => {
    const newSettings = {
      ...settings,
      categories: settings.categories.map(cat => ({
        ...cat,
        isDefault: cat.id === id
      }))
    };
    setSettings(newSettings);
    setRawSettings(newSettings);
  }, [settings, setRawSettings]);

  return {
    settings,
    loading,
    updateSetting,
    resetSettings,
    updateUserInfo,
    changePassword,
    exportData,
    importData,
    // 레거시 카테고리 관리 (하위 호환성)
    addCategory,
    removeCategory,
    updateCategory,
    setDefaultCategory,
  };
};