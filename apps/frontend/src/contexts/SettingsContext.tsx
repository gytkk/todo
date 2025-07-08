"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { AppSettings } from '@calendar-todo/shared-types';
import { useSettings } from '@/hooks/useSettings';

interface SettingsContextType {
  // Settings related
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  setSettings: (settings: AppSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const settingsHook = useSettings();

  const contextValue: SettingsContextType = {
    ...settingsHook,
  };

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