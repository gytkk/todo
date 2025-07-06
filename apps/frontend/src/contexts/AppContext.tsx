"use client";

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { TodoItem, AppSettings, TodoCategory, CategoryFilter } from '@calendar-todo/shared-types';
import { useTodos } from '@/hooks/useTodos';
import { useCalendar } from '@/hooks/useCalendar';
import { useSettings } from '@/hooks/useSettings';
import { useCategories } from '@/hooks/useCategories';
import { initializeDataCleanup } from '@/utils/dataCleanup';

interface AppContextType {
  // Todo related
  todos: TodoItem[];
  addTodo: (title: string, date: Date, categoryId: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearAllTodos: () => void;
  getTodosByDate: (date: Date) => TodoItem[];
  getTodoStats: () => any;

  // Calendar related
  selectedDate: Date | undefined;
  isSidebarOpen: boolean;
  calendarEvents: any[];
  currentDate: Date;
  handleDateSelect: (date: Date) => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  setSelectedDate: (date: Date | undefined) => void;
  handleNavigate: (date: Date) => void;

  // Settings related
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  setSettings: (settings: AppSettings) => void;

  // Category related
  categories: TodoCategory[];
  categoryFilter: CategoryFilter;
  toggleCategoryFilter: (categoryId: string) => void;
  getFilteredTodos: (todos: TodoItem[]) => TodoItem[];
  addCategory: (name: string, color: string) => TodoCategory;
  updateCategory: (id: string, updates: Partial<TodoCategory>) => void;
  deleteCategory: (id: string, todos: TodoItem[]) => boolean;
  getCategoryById: (id: string) => TodoCategory | undefined;
  getAvailableColors: () => string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const categoryHook = useCategories();
  const todoHook = useTodos(categoryHook.categories);
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
    ...categoryHook,
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
