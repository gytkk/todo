import React from 'react';
import { CalendarCellProps } from './types/calendar';
import { CalendarTodos } from './CalendarTodos';
import { getTodoCompletionStats, hasIncompleteTodos, getPrimaryCategoryColor, shouldShowMixedCategoryIndicator } from './utils/calendarUtils';

export const CalendarCell: React.FC<CalendarCellProps> = ({
  date,
  isToday,
  isSelected,
  isCurrentMonth,
  todos,
  onSelect,
}) => {
  const { total, completed } = getTodoCompletionStats(todos);
  const hasIncomplete = hasIncompleteTodos(todos);
  const primaryColor = getPrimaryCategoryColor(todos);
  const showMixedIndicator = shouldShowMixedCategoryIndicator(todos);

  const handleClick = () => {
    onSelect(date);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(date);
    }
  };


  return (
    <div
      className={`h-full p-2 border-r border-b border-gray-200 cursor-pointer transition-colors relative flex flex-col ${
        isToday
          ? 'bg-blue-50 hover:bg-blue-100'
          : isCurrentMonth
            ? 'bg-white hover:bg-gray-50'
            : 'bg-gray-50 hover:bg-gray-100'
        } ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${date.getDate()}일${todos.length > 0 ? `, ${todos.length}개 할일` : ''}`}
    >
      {/* 상단 영역: 날짜와 할일 개수 */}
      <div className="flex items-center justify-between mb-2">
        {/* 빈 공간 (균형을 위해) */}
        <div className="w-8"></div>

        {/* 날짜 표시 (중앙) */}
        <div
          className={`text-sm font-medium flex items-center justify-center w-7 h-7 ${
            isSelected
              ? 'bg-blue-500 text-white rounded-full font-semibold leading-none shadow-md'
              : isToday
                ? 'text-gray-900 font-semibold'
                : isCurrentMonth
                  ? 'text-gray-900'
                  : 'text-gray-400'
          }`}
        >
          {date.getDate()}
        </div>

        {/* 할일 개수 표시 (오른쪽) */}
        <div className="w-8 flex justify-end">
          {total > 0 && (
            <div className="flex items-center gap-1">
              {hasIncomplete && (
                <div className="relative">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: primaryColor }}
                  />
                  {showMixedIndicator && (
                    <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-yellow-500 rounded-full border border-white" />
                  )}
                </div>
              )}
              <div className="text-xs text-gray-500">
                {completed}/{total}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 할일 목록 - 남은 공간 차지 */}
      <div className="flex-1 overflow-hidden">
        <CalendarTodos
          todos={todos}
          date={date}
          compact={true}
        />
      </div>

    </div>
  );
};
