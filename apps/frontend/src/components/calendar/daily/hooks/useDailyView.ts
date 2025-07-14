import { useState, useMemo, useEffect } from 'react';
import { addDays, subDays, isSameDay, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TodoItem } from '@calendar-todo/shared-types';

export interface DayData {
  date: Date;
  todos: TodoItem[];
  stats: {
    total: number;
    completed: number;
    completion: number;
  };
}

export interface DailyViewData {
  selectedDate: Date;
  days: DayData[];
  selectedDayIndex: number;
}

export const useDailyView = (
  initialDate: Date = new Date(),
  todos: TodoItem[]
) => {
  // initialDate가 undefined일 수 있으므로 항상 유효한 날짜를 보장
  const validInitialDate = initialDate || new Date();
  const [selectedDate, setSelectedDate] = useState(validInitialDate);

  // initialDate가 변경될 때 selectedDate 업데이트
  useEffect(() => {
    const validDate = initialDate || new Date();
    if (validDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(validDate);
    }
  }, [initialDate, selectedDate]);

  // 더 많은 날짜 데이터 생성 (선택된 날짜 기준으로 앞뒤 90일씩)
  const dailyData: DailyViewData = useMemo(() => {
    // 날짜별 할일 필터링 함수 (이미 필터링된 todos를 받으므로 카테고리 필터링 불필요)
    const getDayTodos = (date: Date): TodoItem[] => {
      return todos.filter(todo => isSameDay(todo.date, date));
    };

    // 통계 계산 함수
    const getStats = (dayTodos: TodoItem[]) => {
      const total = dayTodos.length;
      const completed = dayTodos.filter(todo => todo.completed).length;
      const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { total, completed, completion };
    };

    const days: DayData[] = [];
    const totalDays = 61; // 앞뒤 30일씩 + 선택날짜 = 총 61일
    const selectedDayIndex = 30; // 가운데가 선택된 날짜

    for (let i = 0; i < totalDays; i++) {
      const dayOffset = i - selectedDayIndex;
      const currentDate = addDays(selectedDate, dayOffset);
      const dayTodos = getDayTodos(currentDate);

      days.push({
        date: currentDate,
        todos: dayTodos,
        stats: getStats(dayTodos)
      });
    }

    // 실제 선택된 날짜의 인덱스 찾기
    const actualSelectedDayIndex = days.findIndex(day => 
      isSameDay(day.date, selectedDate)
    );

    return {
      selectedDate,
      days,
      selectedDayIndex: actualSelectedDayIndex >= 0 ? actualSelectedDayIndex : selectedDayIndex
    };
  }, [selectedDate, todos]);

  // 날짜 네비게이션
  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const goToDate = (date: Date) => {
    setSelectedDate(date);
  };

  // 날짜 포맷팅 헬퍼
  const formatDate = (date: Date, formatStr: string = 'MM월 dd일 (E)') => {
    return format(date, formatStr, { locale: ko });
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  return {
    dailyData,
    selectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    goToDate,
    formatDate,
    isToday
  };
};
