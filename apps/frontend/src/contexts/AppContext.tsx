"use client";

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { TodoItem, AppSettings, PageType, SidebarState, CalendarState } from '@/types';
import { useTodos } from '@/hooks/useTodos';
import { useCalendar } from '@/hooks/useCalendar';
import { useSettings } from '@/hooks/useSettings';
import { initializeDataCleanup } from '@/utils/dataCleanup';

interface AppContextType {
  // Todo related
  todos: TodoItem[];
  addTodo: (title: string, date: Date) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearAllTodos: () => void;
  getTodosByDate: (date: Date) => TodoItem[];
  getTodoStats: () => any;

  // Calendar related
  selectedDate: Date | undefined;
  isSidebarOpen: boolean;
  calendarEvents: any[];
  handleDateSelect: (date: Date) => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  setSelectedDate: (date: Date | undefined) => void;

  // Settings related
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  setSettings: (settings: AppSettings) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const todoHook = useTodos();
  const calendarHook = useCalendar(todoHook.todos);
  const settingsHook = useSettings();

  // Initialize data cleanup on app start
  useEffect(() => {
    initializeDataCleanup();
  }, []);

  const contextValue: AppContextType = {
    ...todoHook,
    ...calendarHook,
    ...settingsHook,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}