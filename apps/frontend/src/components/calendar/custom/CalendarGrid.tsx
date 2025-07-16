import React, { useMemo } from 'react';
import { CalendarGridProps } from './types/calendar';
import { CalendarCell } from './CalendarCell';
import { createCalendarDates, createWeekCalendarDates, getCategoryColorWithOpacity, getPrimaryCategoryColor } from './utils/calendarUtils';
import { calendarUtils } from '@/utils/dateUtils';
import { DailyView } from '../daily/DailyView';

const CalendarGridComponent: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  todos,
  onDateSelect,
  onDateChangeWithoutSidebar,
  view,
  allTodos = [],
  hasActiveFilters = false,
}) => {
  const calendarDates = useMemo(() => {
    return view === 'week'
      ? createWeekCalendarDates(currentDate, selectedDate, todos)
      : createCalendarDates(currentDate, selectedDate, todos);
  }, [view, currentDate, selectedDate, todos]);
  
  const weekdayNames = useMemo(() => calendarUtils.getWeekdayNames(), []);

  if (view === 'month') {
    return (
      <div className="flex-1 bg-white flex flex-col relative">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0">
          {weekdayNames.map((day, index) => (
            <div
              key={day}
              className={`p-3 text-sm font-semibold text-center ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 - 6주 고정 높이 */}
        <div className="grid grid-cols-7 border-l border-gray-200" style={{ height: 'calc(100vh - 210px', gridTemplateRows: 'repeat(6, minmax(80px, 1fr))' }}>
          {calendarDates.map((calendarDate) => (
            <CalendarCell
              key={calendarDate.date.getTime()}
              date={calendarDate.date}
              isToday={calendarDate.isToday}
              isSelected={calendarDate.isSelected}
              isCurrentMonth={calendarDate.isCurrentMonth}
              todos={calendarDate.todos}
              onSelect={onDateSelect}
              allTodos={allTodos.filter(todo => {
                const todoDate = new Date(todo.date);
                return todoDate.getDate() === calendarDate.date.getDate() &&
                  todoDate.getMonth() === calendarDate.date.getMonth() &&
                  todoDate.getFullYear() === calendarDate.date.getFullYear();
              })}
              hasActiveFilters={hasActiveFilters}
            />
          ))}
        </div>

        {/* 필터링 결과가 없을 때 안내 메시지 */}
        {hasActiveFilters && todos.length === 0 && allTodos.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 pointer-events-none">
            <div className="text-center p-6">
              <div className="text-gray-500 mb-2">🔍</div>
              <p className="text-gray-600 font-medium">선택한 카테고리에 할일이 없습니다</p>
              <p className="text-gray-500 text-sm mt-1">왼쪽 필터를 확인해보세요</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'week') {
    return (
      <div className="flex-1 bg-white relative">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekdayNames.map((day, index) => (
            <div
              key={day}
              className={`p-3 text-sm font-semibold text-center ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 주 뷰 그리드 - 1행 7열 */}
        <div className="grid grid-cols-7 border-l border-gray-200" style={{ height: 'calc(100vh - 150px)' }}>
          {calendarDates.map((calendarDate) => (
            <div
              key={calendarDate.date.getTime()}
              className={`p-3 border-r border-gray-200 cursor-pointer transition-colors ${calendarDate.isToday
                ? 'bg-blue-50 hover:bg-blue-100'
                : 'bg-white hover:bg-gray-50'
                } ${calendarDate.isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              onClick={() => onDateSelect(calendarDate.date)}
            >
              <div className="flex items-center justify-between mb-3">
                {/* 빈 공간 (균형을 위해) */}
                <div className="flex-1"></div>

                {/* 날짜 표시 (중앙) */}
                <div
                  className={`text-lg font-semibold ${calendarDate.isSelected
                    ? 'w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md'
                    : calendarDate.isToday
                      ? 'text-gray-900'
                      : calendarDate.isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                >
                  {calendarDate.date.getDate()}
                </div>

                {/* 할일 개수 표시 (오른쪽) */}
                <div className="flex-1 flex justify-end">
                  {calendarDate.todos.length > 0 && (
                    <div className="flex items-center gap-1">
                      {calendarDate.todos.some(t => !t.completed) && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getPrimaryCategoryColor(calendarDate.todos.filter(t => !t.completed)) }}
                        />
                      )}
                      <div className="text-xs text-gray-500">
                        {calendarDate.todos.filter(t => t.completed).length}/{calendarDate.todos.length}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                {calendarDate.todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`text-xs px-2 py-1 rounded-sm truncate ${todo.completed
                      ? 'bg-gray-100 text-gray-500 line-through'
                      : ''
                      }`}
                    style={todo.completed ? {} : {
                      backgroundColor: getCategoryColorWithOpacity(todo.category.color, 0.15),
                      color: todo.category.color
                    }}
                    title={todo.title}
                  >
                    {todo.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 필터링 결과가 없을 때 안내 메시지 */}
        {hasActiveFilters && todos.length === 0 && allTodos.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 pointer-events-none">
            <div className="text-center p-6">
              <div className="text-gray-500 mb-2">🔍</div>
              <p className="text-gray-600 font-medium">선택한 카테고리에 할일이 없습니다</p>
              <p className="text-gray-500 text-sm mt-1">왼쪽 필터를 확인해보세요</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'day') {
    // 매번 새로운 오늘 날짜 생성 (useMemo 제거)
    const today = new Date();
    console.log('CalendarGrid: 일간 보기로 오늘 날짜 전달:', today.toISOString().split('T')[0]);
    
    return (
      <div className="flex-1 bg-white relative overflow-hidden">
        <DailyView
          selectedDate={today} // 항상 오늘 날짜로 시작
          onDateChange={onDateChangeWithoutSidebar || onDateSelect}
        />
      </div>
    );
  }

  return null;
};

export const CalendarGrid = React.memo(CalendarGridComponent);
