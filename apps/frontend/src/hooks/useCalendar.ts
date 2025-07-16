import { useState, useCallback, useMemo, useRef } from 'react';
import { CalendarEvent, TodoItem } from '@calendar-todo/shared-types';

export const useCalendar = (todos: TodoItem[]) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const closingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    setCurrentDate(date); // 선택한 날짜로 currentDate도 업데이트
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    // 기존 타이머가 있다면 취소
    if (closingTimeoutRef.current) {
      clearTimeout(closingTimeoutRef.current);
    }
    
    // 약간의 지연을 주어 DailyView가 적응할 수 있도록 함
    closingTimeoutRef.current = setTimeout(() => {
      setIsSidebarOpen(false);
      closingTimeoutRef.current = null;
    }, 100);
  }, []);

  const openSidebar = useCallback(() => {
    if (selectedDate) {
      setIsSidebarOpen(true);
    }
  }, [selectedDate]);

  const handleSetSelectedDate = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
  }, []);

  const handleDateChangeWithoutSidebar = useCallback((date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date); // 선택한 날짜로 currentDate도 업데이트
    // 사이드바는 열지 않음
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
    handleDateChangeWithoutSidebar,
    closeSidebar,
    openSidebar,
    setSelectedDate: handleSetSelectedDate,
    handleNavigate,
  };
};