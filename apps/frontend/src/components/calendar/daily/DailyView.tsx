"use client";

import React, { useEffect, useRef } from 'react';
import { DailyViewHeader } from './DailyViewHeader';
import { DaySection } from './DaySection';
import { useDailyView } from './hooks/useDailyView';
import { useTodoContext, useCategoryContext } from '@/contexts/AppContext';

interface DailyViewProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  selectedDate: initialDate,
  onDateChange,
  onViewChange
}) => {
  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo
  } = useTodoContext();
  const {
    categories,
    categoryFilter,
    getFilteredTodos
  } = useCategoryContext();

  // 카테고리 필터가 적용된 할일들
  const filteredTodos = getFilteredTodos(todos);

  const {
    dailyData,
    selectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    goToDate,
    formatDate,
    isToday
  } = useDailyView(initialDate, filteredTodos, categoryFilter);

  // 날짜 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  }, [selectedDate, onDateChange]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 입력 필드에 포커스가 있을 때는 단축키 비활성화
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          goToPreviousDay();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          goToNextDay();
          break;
        case 't':
        case 'T':
          event.preventDefault();
          goToToday();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPreviousDay, goToNextDay, goToToday]);

  // 할일 추가 핸들러 (날짜 지정)
  const handleAddTodo = (date: Date) => (title: string, categoryId: string) => {
    addTodo(title, date, categoryId);
  };

  const { days, selectedDayIndex } = dailyData;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedDayRef = useRef<HTMLDivElement>(null);

  // 선택된 날짜로 스크롤하기
  useEffect(() => {
    if (selectedDayRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selectedElement = selectedDayRef.current;

      const containerHeight = container.clientHeight;
      const selectedTop = selectedElement.offsetTop;
      const selectedHeight = selectedElement.clientHeight;

      // 선택된 요소를 화면 중앙에 위치시키기
      const scrollTop = selectedTop - (containerHeight / 2) + (selectedHeight / 2);

      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [selectedDate]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 헤더 */}
      <DailyViewHeader
        selectedDate={selectedDate}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
        onDateSelect={goToDate}
        formatDate={formatDate}
        isToday={isToday}
        onViewChange={onViewChange}
      />

      {/* 메인 콘텐츠: 세로 스크롤 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {days.map((dayData, index) => {
            const isSelectedDay = index === selectedDayIndex;
            const isTodayActual = isToday(dayData.date);

            return (
              <div
                key={dayData.date.getTime()}
                ref={isSelectedDay ? selectedDayRef : undefined}
                className={`transition-all duration-200 ${isSelectedDay
                    ? 'border-l-4 border-blue-500 pl-4'
                    : 'pl-4'
                  }`}
              >
                <DaySection
                  dayData={dayData}
                  categories={categories}
                  onAddTodo={handleAddTodo(dayData.date)}
                  onToggleTodo={toggleTodo}
                  onDeleteTodo={deleteTodo}
                  isMainSection={isSelectedDay}
                  isToday={isTodayActual}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
