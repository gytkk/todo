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
  initialDate: Date | undefined = undefined,
  todos: TodoItem[]
) => {
  // 안정적인 날짜 초기화 - hydration 불일치 방지
  const [selectedDate, setSelectedDate] = useState(() => {
    // initialDate가 있으면 사용, 없으면 현재 날짜
    if (initialDate) {
      return new Date(initialDate.getTime()); // 새 Date 객체로 복사
    }
    // 현재 시간을 고정하여 서버/클라이언트 일치 보장
    const now = new Date();
    now.setHours(12, 0, 0, 0); // 정오로 설정하여 시간대 문제 방지
    return now;
  });

  // initialDate가 변경될 때만 selectedDate 업데이트
  useEffect(() => {
    if (initialDate && initialDate.getTime() !== selectedDate.getTime()) {
      const newDate = new Date(initialDate.getTime());
      newDate.setHours(12, 0, 0, 0); // 시간 정규화
      setSelectedDate(newDate);
    }
  }, [initialDate, selectedDate]); // 의존성 배열 수정

  // 더 많은 날짜 데이터 생성 (선택된 날짜 기준으로 앞뒤 90일씩)
  const dailyData: DailyViewData = useMemo(() => {
    // 날짜별 할일 필터링 함수 (이미 필터링된 todos를 받으므로 카테고리 필터링 불필요)
    const getDayTodos = (date: Date): TodoItem[] => {
      return todos.filter(todo => {
        const todoDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
        if (isNaN(todoDate.getTime())) {
          return false; // Skip invalid dates
        }
        return isSameDay(todoDate, date);
      });
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

    // 선택된 날짜는 항상 가운데(인덱스 30)에 위치
    return {
      selectedDate,
      days,
      selectedDayIndex: selectedDayIndex // 항상 30으로 고정
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
