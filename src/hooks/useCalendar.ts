import { useState, useCallback, useMemo } from 'react';
import { CalendarEvent, TodoItem } from '@/types';
import { format } from 'date-fns';

export const useCalendar = (todos: TodoItem[]) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    setIsSidebarOpen(true);
  }, []);

  return {
    selectedDate,
    isSidebarOpen,
    calendarEvents,
    handleDateSelect,
    closeSidebar,
    openSidebar,
    setSelectedDate,
  };
};