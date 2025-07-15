"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { CalendarEvent } from '@calendar-todo/shared-types';
import { useCalendar } from '@/hooks/useCalendar';
import { useTodoContext } from './TodoContext';

interface CalendarContextType {
  // Calendar related
  selectedDate: Date | undefined;
  isSidebarOpen: boolean;
  calendarEvents: CalendarEvent[];
  currentDate: Date;
  handleDateSelect: (date: Date) => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  setSelectedDate: (date: Date | undefined) => void;
  handleNavigate: (date: Date) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

interface CalendarProviderProps {
  children: ReactNode;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  const { todos } = useTodoContext();
  const calendarHook = useCalendar(todos);

  const contextValue: CalendarContextType = useMemo(() => ({
    ...calendarHook,
  }), [calendarHook]);

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
}