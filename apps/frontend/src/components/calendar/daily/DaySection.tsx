"use client";

import React from 'react';
import { TodoItemCard } from './TodoItemCard';
import { QuickAddTodo } from './QuickAddTodo';
import { DayData } from './hooks/useDailyView';
import { TodoCategory, TodoType } from '@calendar-todo/shared-types';
import { format, differenceInDays, isSameDay, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DaySectionProps {
  dayData: DayData;
  categories: TodoCategory[];
  onAddTodo: (title: string, categoryId: string, todoType: TodoType) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo?: (id: string) => void;
  isMainSection?: boolean;
  isToday?: boolean;
  recentlyMovedTaskIds?: string[];
}

export const DaySection: React.FC<DaySectionProps> = ({
  dayData,
  categories,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onEditTodo,
  isMainSection = false,
  recentlyMovedTaskIds = [],
}) => {
  const { date, todos, stats } = dayData;

  // 모든 할일을 표시 (통일)
  const displayTodos = todos;

  const handleAddTodo = (title: string, categoryId: string, todoType: TodoType) => {
    onAddTodo(title, categoryId, todoType);
  };

  const getDateLabel = () => {
    // 시간 정보를 제거하고 순수 날짜만 비교
    const today = startOfDay(new Date());
    const dateToCompare = startOfDay(date);

    // 실제로 오늘인지 확인
    if (isSameDay(dateToCompare, today)) {
      return '오늘';
    }

    const diffDays = differenceInDays(dateToCompare, today);

    if (diffDays === -1) return '어제';
    if (diffDays === 1) return '내일';

    return format(date, 'MM월 dd일 (E)', { locale: ko });
  };

  const getProgressBar = () => {
    if (stats.total === 0) return null;

    return (
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.completion}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {stats.completed}/{stats.total}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`transition-all duration-200 ${isMainSection
        ? 'border-b border-gray-200 pb-6'
        : 'border-b border-gray-200 pb-4'
        }`}
    >
      {/* 헤더 */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`font-semibold ${isMainSection ? 'text-xl text-blue-900' : 'text-lg text-gray-900'
                }`}
            >
              {getDateLabel()}
            </h2>
          </div>

          {/* 통계 */}
          <div className="text-right">
            <div className={`font-medium ${isMainSection ? 'text-lg text-blue-900' : 'text-base text-gray-900'
              }`}>
              {stats.completion}%
            </div>
            <div className="text-xs text-gray-500">
              {stats.total}개 할일
            </div>
          </div>
        </div>

        {/* 진행률 바 */}
        {getProgressBar()}
      </div>

      {/* 할일 추가 */}
      <div className="mb-4">
        <QuickAddTodo
          onAddTodo={handleAddTodo}
          categories={categories}
          compact={!isMainSection}
        />
      </div>

      {/* 할일 목록 */}
      <div className="space-y-1.5">
        {displayTodos.map((todo) => (
          <TodoItemCard
            key={todo.id}
            todo={todo}
            onToggle={onToggleTodo}
            onDelete={onDeleteTodo}
            onEdit={onEditTodo}
            compact={false}
            recentlyMoved={recentlyMovedTaskIds.includes(todo.id)}
          />
        ))}

      </div>
    </div>
  );
};
