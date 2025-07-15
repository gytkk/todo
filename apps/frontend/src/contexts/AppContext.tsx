"use client";

import React, { createContext, ReactNode, useEffect, useMemo } from 'react';
import { CategoryProvider } from './CategoryContext';
import { TodoProvider } from './TodoContext';
import { CalendarProvider } from './CalendarContext';
import { SettingsProvider } from './SettingsContext';
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

  const contextValue: AppContextType = useMemo(() => ({
    initialized: true
  }), []);

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

// Export individual context hooks for direct usage
export { useCategoryContext } from './CategoryContext';
export { useTodoContext } from './TodoContext';
export { useCalendarContext } from './CalendarContext';
export { useSettingsContext } from './SettingsContext';
