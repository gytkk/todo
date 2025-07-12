"use client";

import React, { createContext, ReactNode, useEffect } from 'react';
import { CategoryProvider, useCategoryContext } from './CategoryContext';
import { TodoProvider, useTodoContext } from './TodoContext';
import { CalendarProvider, useCalendarContext } from './CalendarContext';
import { SettingsProvider, useSettingsContext } from './SettingsContext';
import { initializeDataCleanup } from '@/utils/dataCleanup';
import { initializeTempUser } from '@/utils/tempUser';

// Combined context type for backward compatibility
interface AppContextType {
  // All contexts are accessible through their specific hooks
  // This interface provides type safety for the combined context
  initialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

// Internal component that provides the combined context
function AppContextProvider({ children }: AppProviderProps) {
  // Initialize data cleanup and temp user on app start
  useEffect(() => {
    initializeDataCleanup();
    initializeTempUser();
  }, []);

  const contextValue: AppContextType = {
    initialized: true
  };

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
        <TodoProvider>
          <CalendarProvider>
            <AppContextProvider>
              {children}
            </AppContextProvider>
          </CalendarProvider>
        </TodoProvider>
      </CategoryProvider>
    </SettingsProvider>
  );
}

// Removed Consumer components - no longer needed as providers access data directly

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
