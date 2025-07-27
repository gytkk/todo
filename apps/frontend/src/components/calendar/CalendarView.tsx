"use client";

import { memo, useState, useCallback } from 'react';
import { TodoItem } from '@calendar-todo/shared-types';
import { CalendarContainer } from './custom';
import { SimpleCalendarSkeleton } from './SimpleCalendarSkeleton';
import { NoSSR } from '../NoSSR';

type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarViewProps {
  currentDate: Date;
  selectedDate?: Date;
  todos: TodoItem[];
  onDateSelect: (date: Date) => void;
  onDateChangeWithoutSidebar?: (date: Date) => void;
  onNavigate: (date: Date) => void;
  onCalendarClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  defaultView?: CalendarViewType;
  allTodos?: TodoItem[]; // 필터링 전 전체 할일 목록
  hasActiveFilters?: boolean; // 필터가 활성화되어 있는지 여부
  recentlyMovedTaskIds?: string[]; // 최근 이동된 작업 ID 목록
}

function CalendarViewComponent({
  currentDate,
  selectedDate,
  todos,
  onDateSelect,
  onDateChangeWithoutSidebar,
  onNavigate,
  onCalendarClick,
  defaultView = 'day',
  allTodos = [],
  hasActiveFilters = false,
  recentlyMovedTaskIds = []
}: CalendarViewProps) {
  const [currentView, setCurrentView] = useState<CalendarViewType>(defaultView);

  const handleDateSelect = useCallback((date: Date) => {
    onDateSelect(date);
  }, [onDateSelect]);

  const handleNavigate = useCallback((date: Date) => {
    onNavigate(date);
  }, [onNavigate]);

  const handleViewChange = useCallback((view: CalendarViewType) => {
    setCurrentView(view);
  }, []);

  const renderCalendarContent = () => {
    // 모든 뷰(월간/주간/일간)를 CalendarContainer를 통해 일관성 있게 처리
    return (
      <div className="h-full bg-white overflow-hidden" onClick={onCalendarClick}>
        <NoSSR fallback={<SimpleCalendarSkeleton />}>
          <div className="h-full">
            <CalendarContainer
              currentDate={currentDate}
              selectedDate={selectedDate}
              todos={todos}
              onDateSelect={handleDateSelect}
              onDateChangeWithoutSidebar={onDateChangeWithoutSidebar}
              onNavigate={handleNavigate}
              view={currentView}
              onViewChange={handleViewChange}
              allTodos={allTodos}
              hasActiveFilters={hasActiveFilters}
              recentlyMovedTaskIds={recentlyMovedTaskIds}
            />
          </div>
        </NoSSR>
      </div>
    );
  };

  return (
    <div className="h-full">
      {renderCalendarContent()}
    </div>
  );
}

export const CalendarView = memo(CalendarViewComponent);
