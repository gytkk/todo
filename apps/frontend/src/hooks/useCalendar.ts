import { useState, useCallback, useMemo } from 'react';
import { CalendarEvent, TodoItem } from '@calendar-todo/shared-types';

export const useCalendar = (todos: TodoItem[]) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return todos.map((todo) => {
      // Ensure date is a proper Date object
      const startDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
      const endDate = new Date(startDate.getTime());
      
      return {
        id: todo.id,
        title: todo.completed ? `✓ ${todo.title}` : todo.title,
        start: startDate,
        end: endDate,
        resource: todo,
      };
    });
  }, [todos]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    if (selectedDate) {
      setIsSidebarOpen(true);
    }
  }, [selectedDate]);

  const handleSetSelectedDate = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
  }, []);

  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  return {
    selectedDate,
    isSidebarOpen,
    calendarEvents,
    currentDate,
    handleDateSelect,
    closeSidebar,
    openSidebar,
    setSelectedDate: handleSetSelectedDate,
    handleNavigate,
  };
};