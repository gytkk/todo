import React from 'react';
import { CalendarHeaderProps } from './types/calendar';
import { CalendarCommonHeader } from '../shared/CalendarCommonHeader';
import { navigateMonth, navigateWeek, navigateDay, getMonthYear, getWeekRange, getDayName } from './utils/dateUtils';
import { isSameDay } from 'date-fns';

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  onNavigate,
  onViewChange,
  onDateSelect,
}) => {
  const handlePrevious = () => {
    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = navigateMonth(currentDate, 'prev');
        onNavigate(newDate);
        break;
      case 'week':
        newDate = navigateWeek(currentDate, 'prev');
        onNavigate(newDate);
        break;
      case 'day':
        newDate = navigateDay(currentDate, 'prev');
        onDateSelect(newDate); // 일간 보기에서는 onDateSelect만 사용
        break;
    }
  };

  const handleNext = () => {
    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = navigateMonth(currentDate, 'next');
        onNavigate(newDate);
        break;
      case 'week':
        newDate = navigateWeek(currentDate, 'next');
        onNavigate(newDate);
        break;
      case 'day':
        newDate = navigateDay(currentDate, 'next');
        onDateSelect(newDate); // 일간 보기에서는 onDateSelect만 사용
        break;
    }
  };

  const handleToday = () => {
    const today = new Date();
    onNavigate(today);
    onDateSelect(today); // 오늘 날짜 선택 및 사이드바 열기
  };

  const getTitle = () => {
    switch (view) {
      case 'month':
        return getMonthYear(currentDate);
      case 'week':
        return getWeekRange(currentDate);
      case 'day':
        return getDayName(currentDate);
    }
  };

  const getNavigationLabel = () => {
    switch (view) {
      case 'month':
        return { prev: '이전 달', next: '다음 달' };
      case 'week':
        return { prev: '이전 주', next: '다음 주' };
      case 'day':
        return { prev: '이전 일', next: '다음 일' };
    }
  };

  // 오늘 버튼은 정확히 오늘 날짜를 보고 있을 때만 비활성화
  const isCurrentlyToday = isSameDay(currentDate, new Date());

  return (
    <CalendarCommonHeader
      currentView={view}
      onViewChange={onViewChange}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onToday={handleToday}
      title={getTitle()}
      navigationLabels={getNavigationLabel()}
      isTodayDisabled={isCurrentlyToday}
    />
  );
};
