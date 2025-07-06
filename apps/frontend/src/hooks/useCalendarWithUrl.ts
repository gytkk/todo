import { useState, useCallback, useMemo, useEffect } from 'react';
import { CalendarEvent, TodoItem } from '@/types';
import { format } from 'date-fns';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export const useCalendarWithUrl = (todos: TodoItem[]) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // URL에서 날짜 파라미터 읽기
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const sidebarParam = searchParams.get('sidebar');
    
    if (dateParam) {
      try {
        const date = new Date(dateParam);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      } catch {
        console.error('Invalid date parameter:', dateParam);
      }
    }
    
    setIsSidebarOpen(sidebarParam === 'true');
  }, [searchParams]);

  // URL 파라미터 업데이트 함수
  const updateUrlParams = useCallback((date?: Date, sidebar?: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (date) {
      params.set('date', format(date, 'yyyy-MM-dd'));
    } else {
      params.delete('date');
    }
    
    if (sidebar !== undefined) {
      if (sidebar) {
        params.set('sidebar', 'true');
      } else {
        params.delete('sidebar');
      }
    }
    
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [router, searchParams, pathname]);

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
    updateUrlParams(date, true);
  }, [updateUrlParams]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    updateUrlParams(selectedDate, false);
  }, [updateUrlParams, selectedDate]);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
    updateUrlParams(selectedDate, true);
  }, [updateUrlParams, selectedDate]);

  const handleSetSelectedDate = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      updateUrlParams(date, isSidebarOpen);
    }
  }, [updateUrlParams, isSidebarOpen]);

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