"use client";

import { memo } from 'react';
import { TodoItem } from '@calendar-todo/shared-types';
import { CalendarContainer } from './custom';
import { SimpleCalendarSkeleton } from './SimpleCalendarSkeleton';
import { NoSSR } from '../NoSSR';

interface CalendarViewProps {
  currentDate: Date;
  selectedDate?: Date;
  todos: TodoItem[];
  onDateSelect: (date: Date) => void;
  onNavigate: (date: Date) => void;
  onCalendarClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

function CalendarViewComponent({
  currentDate,
  selectedDate,
  todos,
  onDateSelect,
  onNavigate,
  onCalendarClick
}: CalendarViewProps) {
  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
  };

  const handleNavigate = (date: Date) => {
    onNavigate(date);
  };

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
          />
        </div>
      </NoSSR>
    </div>
  );
}

export const CalendarView = memo(CalendarViewComponent);