"use client";

import React from 'react';
import { Button } from "@calendar-todo/ui";
import { ChevronLeft, ChevronRight, Home, Grid3X3, Calendar, List } from 'lucide-react';

type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarCommonHeaderProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onToday: () => void;
  title: string;
  navigationLabels?: {
    prev: string;
    next: string;
  };
  isTodayDisabled?: boolean;
  hideNavigation?: boolean;
}

export const CalendarCommonHeader: React.FC<CalendarCommonHeaderProps> = ({
  currentView,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  title,
  navigationLabels,
  isTodayDisabled = false,
  hideNavigation = false
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      {/* 왼쪽: 오늘 버튼 */}
      <div className="flex items-center">
        <Button
          variant="outline"
          onClick={onToday}
          disabled={isTodayDisabled}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          오늘
        </Button>
      </div>

      {/* 중앙: 현재 날짜/기간 표시 with 네비게이션 */}
      <div className="flex items-center gap-2">
        {!hideNavigation && onPrevious && navigationLabels && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            className="rounded-full w-8 h-8 p-0 hover:bg-gray-100"
            title={navigationLabels.prev}
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </Button>
        )}

        <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
          {title}
        </h2>

        {!hideNavigation && onNext && navigationLabels && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            className="rounded-full w-8 h-8 p-0 hover:bg-gray-100"
            title={navigationLabels.next}
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </Button>
        )}
      </div>

      {/* 오른쪽: 뷰 선택 버튼 */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <Button
          variant={currentView === 'day' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('day')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentView === 'day'
              ? 'bg-white text-gray-900 shadow-sm hover:bg-gray-50'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <List className="h-4 w-4" />
          일간
        </Button>
        <Button
          variant={currentView === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('week')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentView === 'week'
              ? 'bg-white text-gray-900 shadow-sm hover:bg-gray-50'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Calendar className="h-4 w-4" />
          주간
        </Button>
        <Button
          variant={currentView === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('month')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentView === 'month'
              ? 'bg-white text-gray-900 shadow-sm hover:bg-gray-50'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Grid3X3 className="h-4 w-4" />
          월간
        </Button>
      </div>
    </div>
  );
};
