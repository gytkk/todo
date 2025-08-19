"use client";

import React, { createContext, ReactNode, useEffect, useMemo, useContext } from 'react';
import { CategoryProvider } from './CategoryContext';
import { TodoProvider } from './TodoContext';
import { CalendarProvider } from './CalendarContext';
import { SettingsProvider } from './SettingsContext';
import { initializeDataCleanup } from '@/utils/dataCleanup';
import { initializeTempUser } from '@/utils/tempUser';
import { useTaskMover } from '@/hooks/useTaskMover';

// Combined context type for backward compatibility
interface AppContextType {
  // All contexts are accessible through their specific hooks
  // This interface provides type safety for the combined context
  initialized: boolean;
  recentlyMovedTaskIds: string[];
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

  // Initialize task mover for automatic task movement
  const { recentlyMovedTaskIds } = useTaskMover();

  const contextValue: AppContextType = useMemo(() => ({
    initialized: true,
    recentlyMovedTaskIds
  }), [recentlyMovedTaskIds]);

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

// Hook to use the AppContext
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Export individual context hooks for direct usage
export { useCategoryContext } from './CategoryContext';
export { useTodoContext } from './TodoContext';
export { useCalendarContext } from './CalendarContext';
export { useSettingsContext } from './SettingsContext';
