import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarHeaderProps, CalendarView } from './types/calendar';
import { navigateMonth, navigateWeek, navigateDay, getMonthYear, getWeekRange, getDayName } from './utils/dateUtils';

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  onNavigate,
  onViewChange,
}) => {
  const handlePrevious = () => {
    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = navigateMonth(currentDate, 'prev');
        break;
      case 'week':
        newDate = navigateWeek(currentDate, 'prev');
        break;
      case 'day':
        newDate = navigateDay(currentDate, 'prev');
        break;
    }
    onNavigate(newDate);
  };

  const handleNext = () => {
    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = navigateMonth(currentDate, 'next');
        break;
      case 'week':
        newDate = navigateWeek(currentDate, 'next');
        break;
      case 'day':
        newDate = navigateDay(currentDate, 'next');
        break;
    }
    onNavigate(newDate);
  };

  const handleToday = () => {
    onNavigate(new Date());
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

  const navLabels = getNavigationLabel();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      {/* 오늘 버튼 */}
      <div className="flex items-center">
        <button
          onClick={handleToday}
          className="px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          오늘
        </button>
      </div>

      {/* 현재 날짜/기간 표시 with 네비게이션 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={navLabels.prev}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
          {getTitle()}
        </h2>
        
        <button
          onClick={handleNext}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={navLabels.next}
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 뷰 선택 버튼 */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onViewChange('month')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === 'month'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          월
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === 'week'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          주
        </button>
        <button
          onClick={() => onViewChange('day')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === 'day'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          일
        </button>
      </div>
    </div>
  );
};