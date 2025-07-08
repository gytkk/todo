"use client";

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { CategoryProvider, useCategoryContext } from './CategoryContext';
import { TodoProvider, useTodoContext } from './TodoContext';
import { CalendarProvider, useCalendarContext } from './CalendarContext';
import { SettingsProvider, useSettingsContext } from './SettingsContext';
import { initializeDataCleanup } from '@/utils/dataCleanup';

// Combined context type for backward compatibility
interface AppContextType {
  // All contexts are accessible through their specific hooks
  // This interface provides type safety for the combined context
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

// Internal component that provides the combined context
function AppContextProvider({ children }: AppProviderProps) {
  const categories = useCategoryContext();
  const todos = useTodoContext();
  const calendar = useCalendarContext();
  const settings = useSettingsContext();

  // Initialize data cleanup on app start
  useEffect(() => {
    initializeDataCleanup();
  }, []);

  const contextValue: AppContextType = {};

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <SettingsProvider>
      <CategoryProvider>
        {/* TodoProvider needs categories, so it's inside CategoryProvider */}
        <CategoryConsumer>
          {(categories) => (
            <TodoProvider categories={categories}>
              {/* CalendarProvider needs todos, so it's inside TodoProvider */}
              <TodoConsumer>
                {(todos) => (
                  <CalendarProvider todos={todos}>
                    <AppContextProvider>
                      {children}
                    </AppContextProvider>
                  </CalendarProvider>
                )}
              </TodoConsumer>
            </TodoProvider>
          )}
        </CategoryConsumer>
      </CategoryProvider>
    </SettingsProvider>
  );
}

// Helper components to pass data between providers
function CategoryConsumer({ children }: { children: (categories: any) => ReactNode }) {
  const { categories } = useCategoryContext();
  return <>{children(categories)}</>;
}

function TodoConsumer({ children }: { children: (todos: any) => ReactNode }) {
  const { todos } = useTodoContext();
  return <>{children(todos)}</>;
}

// Hook that combines all contexts for backward compatibility
export function useAppContext() {
  const categoryContext = useCategoryContext();
  const todoContext = useTodoContext();
  const calendarContext = useCalendarContext();
  const settingsContext = useSettingsContext();

  return {
    ...categoryContext,
    ...todoContext,
    ...calendarContext,
    ...settingsContext,
  };
}
