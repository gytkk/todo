"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { AppSettings, Category, UserInfo } from '@calendar-todo/shared-types';
import { useSettings } from '@/hooks/useSettings';

interface SettingsContextType {
  // Settings related
  settings: AppSettings;
  loading: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  updateUserInfo: (updates: Partial<UserInfo>) => void;
  changePassword: (currentPassword: string, newPassword: string) => void;
  exportData: () => Promise<Blob>;
  importData: (file: File) => Promise<void>;
  // Legacy category management (for compatibility)
  addCategory: (name: string, color: string) => void;
  removeCategory: (id: string) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  setDefaultCategory: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const settingsHook = useSettings();

  const contextValue: SettingsContextType = useMemo(() => ({
    ...settingsHook,
  }), [settingsHook]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}