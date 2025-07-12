"use client";

import React from 'react';
import { Button } from "@calendar-todo/ui";
import { ChevronLeft, ChevronRight, Home, Grid3X3, Calendar, List } from 'lucide-react';

type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarCommonHeaderProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  title: string;
  navigationLabels: {
    prev: string;
    next: string;
  };
  isTodayDisabled?: boolean;
  activeFilters?: { id: string; name: string; color: string }[];
  hasActiveFilters?: boolean;
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
  activeFilters = [],
  hasActiveFilters = false
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
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          className="rounded-full w-8 h-8 p-0 hover:bg-gray-100"
          title={navigationLabels.prev}
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </Button>

        <div className="flex flex-col items-center min-w-[200px]">
          <h2 className="text-lg font-semibold text-gray-900 text-center">
            {title}
          </h2>
          {hasActiveFilters && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-500">필터:</span>
              {activeFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border"
                  style={{ borderColor: filter.color }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: filter.color }}
                  />
                  <span className="text-xs text-gray-700">{filter.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="rounded-full w-8 h-8 p-0 hover:bg-gray-100"
          title={navigationLabels.next}
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </Button>
      </div>

      {/* 오른쪽: 뷰 선택 버튼 */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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
      </div>
    </div>
  );
};
