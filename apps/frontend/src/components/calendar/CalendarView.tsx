"use client";

import { memo, useState, useCallback } from 'react';
import { TodoItem } from '@calendar-todo/shared-types';
import { CalendarContainer } from './custom';
import { DailyView } from './daily';
import { SimpleCalendarSkeleton } from './SimpleCalendarSkeleton';
import { NoSSR } from '../NoSSR';

type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarViewProps {
  currentDate: Date;
  selectedDate?: Date;
  todos: TodoItem[];
  onDateSelect: (date: Date) => void;
  onNavigate: (date: Date) => void;
  onCalendarClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  defaultView?: CalendarViewType;
}

function CalendarViewComponent({
  currentDate,
  selectedDate,
  todos,
  onDateSelect,
  onNavigate,
  onCalendarClick,
  defaultView = 'month'
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
              onNavigate={handleNavigate}
              view={currentView}
              onViewChange={handleViewChange}
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