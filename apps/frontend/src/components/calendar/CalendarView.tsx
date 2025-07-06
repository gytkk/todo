"use client";

import { memo, useState } from 'react';
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

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
  };

  const handleNavigate = (date: Date) => {
    onNavigate(date);
  };

  const handleViewChange = (view: CalendarViewType) => {
    setCurrentView(view);
  };

  const renderCalendarContent = () => {
    if (currentView === 'day') {
      return (
        <DailyView
          selectedDate={selectedDate || currentDate}
          onDateChange={handleNavigate}
          onViewChange={handleViewChange}
        />
      );
    }

    // 월간/주간 뷰는 기존 캘린더 사용
    return (
      <div className="h-full bg-white" onClick={onCalendarClick}>
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