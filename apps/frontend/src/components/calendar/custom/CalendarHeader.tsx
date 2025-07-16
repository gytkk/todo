import React from 'react';
import { CalendarHeaderProps } from './types/calendar';
import { CalendarCommonHeader } from '../shared/CalendarCommonHeader';
import { calendarUtils } from '@/utils/dateUtils';
import { isSameDay } from 'date-fns';

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  onNavigate,
  onViewChange,
  onDateSelect,
  onDateChangeWithoutSidebar,
}) => {
  const handlePrevious = () => {
    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = calendarUtils.navigateMonth(currentDate, 'prev');
        onNavigate(newDate);
        break;
      case 'week':
        newDate = calendarUtils.navigateWeek(currentDate, 'prev');
        onNavigate(newDate);
        break;
      case 'day':
        newDate = calendarUtils.navigateDay(currentDate, 'prev');
        onNavigate(newDate); // 일간 보기에서는 네비게이션만 (사이드바 열지 않음)
        if (onDateChangeWithoutSidebar) {
          onDateChangeWithoutSidebar(newDate);
        }
        break;
    }
  };

  const handleNext = () => {
    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = calendarUtils.navigateMonth(currentDate, 'next');
        onNavigate(newDate);
        break;
      case 'week':
        newDate = calendarUtils.navigateWeek(currentDate, 'next');
        onNavigate(newDate);
        break;
      case 'day':
        newDate = calendarUtils.navigateDay(currentDate, 'next');
        onNavigate(newDate); // 일간 보기에서는 네비게이션만 (사이드바 열지 않음)
        if (onDateChangeWithoutSidebar) {
          onDateChangeWithoutSidebar(newDate);
        }
        break;
    }
  };

  const handleToday = () => {
    const today = new Date();
    onNavigate(today);
    
    // 일간 보기가 아닐 때만 사이드바 열기
    if (view !== 'day') {
      onDateSelect(today); // 오늘 날짜 선택 및 사이드바 열기
    } else {
      // 일간 보기에서는 사이드바를 열지 않고 날짜만 변경
      if (onDateChangeWithoutSidebar) {
        onDateChangeWithoutSidebar(today);
      }
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'month':
        return calendarUtils.getMonthYear(currentDate);
      case 'week':
        return calendarUtils.getWeekRange(currentDate);
      case 'day':
        return calendarUtils.getDayName(currentDate);
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
