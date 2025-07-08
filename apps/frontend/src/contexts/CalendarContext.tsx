"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { CalendarEvent, TodoItem } from '@calendar-todo/shared-types';
import { useCalendar } from '@/hooks/useCalendar';

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
  todos: TodoItem[];
}

export function CalendarProvider({ children, todos }: CalendarProviderProps) {
  const calendarHook = useCalendar(todos);

  const contextValue: CalendarContextType = {
    ...calendarHook,
  };

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