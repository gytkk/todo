"use client";

import React from 'react';
import { CalendarCommonHeader } from '../shared/CalendarCommonHeader';

type CalendarViewType = 'month' | 'week' | 'day';

interface DailyViewHeaderProps {
  selectedDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onDateSelect?: (date: Date) => void;
  formatDate: (date: Date, formatStr?: string) => string;
  isToday: (date: Date) => boolean;
  onViewChange?: (view: CalendarViewType) => void;
}

export const DailyViewHeader: React.FC<DailyViewHeaderProps> = ({
  selectedDate,
  onPreviousDay,
  onNextDay,
  onToday,
  formatDate,
  isToday,
  onViewChange
}) => {
  const todayDate = isToday(selectedDate);

  const getTitle = () => {
    return `${formatDate(selectedDate, 'MM월 dd일')} ${formatDate(selectedDate, 'EEEE')}`;
  };

  const handleViewChange = (view: CalendarViewType) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <CalendarCommonHeader
      currentView="day"
      onViewChange={handleViewChange}
      onPrevious={onPreviousDay}
      onNext={onNextDay}
      onToday={onToday}
      title={getTitle()}
      navigationLabels={{
        prev: '이전 날',
        next: '다음 날'
      }}
      isTodayDisabled={todayDate}
    />
  );
};
