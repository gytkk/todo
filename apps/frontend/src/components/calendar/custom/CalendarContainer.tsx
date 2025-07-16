import React, { useState, useCallback } from 'react';
import { CalendarProps, CalendarView } from './types/calendar';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';

export const CalendarContainer: React.FC<CalendarProps> = ({
  currentDate,
  selectedDate,
  todos,
  onDateSelect,
  onDateChangeWithoutSidebar,
  onNavigate,
  view: initialView = 'day',
  onViewChange,
  allTodos = [],
  hasActiveFilters = false,
}) => {
  const [view, setView] = useState<CalendarView>(initialView);

  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
    onViewChange?.(newView);
  }, [onViewChange]);

  const handleDateSelect = useCallback((date: Date) => {
    onDateSelect(date);
  }, [onDateSelect]);

  const handleNavigate = useCallback((date: Date) => {
    onNavigate(date);
  }, [onNavigate]);

  return (
    <div className="h-full flex flex-col bg-white">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onNavigate={handleNavigate}
        onViewChange={handleViewChange}
        onDateSelect={handleDateSelect}
        onDateChangeWithoutSidebar={onDateChangeWithoutSidebar}
      />

      <CalendarGrid
        currentDate={currentDate}
        selectedDate={selectedDate}
        todos={todos}
        onDateSelect={handleDateSelect}
        onDateChangeWithoutSidebar={onDateChangeWithoutSidebar}
        view={view}
        allTodos={allTodos}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
};
