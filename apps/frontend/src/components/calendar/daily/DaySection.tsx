"use client";

import React, { useState } from 'react';
import { TodoItemCard } from './TodoItemCard';
import { QuickAddTodo } from './QuickAddTodo';
import { DayData } from './hooks/useDailyView';
import { TodoCategory } from '@calendar-todo/shared-types';
import { format, differenceInDays, isSameDay, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@calendar-todo/ui";

interface DaySectionProps {
  dayData: DayData;
  categories: TodoCategory[];
  onAddTodo: (title: string, categoryId: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo?: (id: string) => void;
  isMainSection?: boolean;
  isToday?: boolean;
}

export const DaySection: React.FC<DaySectionProps> = ({
  dayData,
  categories,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onEditTodo,
  isMainSection = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(isMainSection);
  const { date, todos, stats } = dayData;

  // 보조 섹션에서 표시할 최대 할일 개수
  const maxTodosInSideSection = 3;
  const shouldShowExpandButton = !isMainSection && todos.length > maxTodosInSideSection;
  const displayTodos = isMainSection || isExpanded
    ? todos
    : todos.slice(0, maxTodosInSideSection);

  const handleAddTodo = (title: string, categoryId: string) => {
    onAddTodo(title, categoryId);
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
        ? 'bg-blue-50/30 border-b border-blue-200 pb-6'
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
        {isMainSection && getProgressBar()}
      </div>

      {/* 할일 추가 (메인 섹션만) */}
      {isMainSection && (
        <div className="mb-4">
          <QuickAddTodo
            onAddTodo={handleAddTodo}
            categories={categories}
            compact={false}
          />
        </div>
      )}

      {/* 할일 목록 */}
      <div className="space-y-2">
        {displayTodos.map((todo) => (
          <TodoItemCard
            key={todo.id}
            todo={todo}
            onToggle={onToggleTodo}
            onDelete={onDeleteTodo}
            onEdit={onEditTodo}
            compact={!isMainSection}
          />
        ))}

        {/* 더보기/접기 버튼 */}
        {shouldShowExpandButton && (
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-2 text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                접기
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                {todos.length - maxTodosInSideSection}개 더보기
              </>
            )}
          </Button>
        )}

        {/* 보조 섹션에서 할일 추가 */}
        {!isMainSection && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <QuickAddTodo
              onAddTodo={handleAddTodo}
              categories={categories}
              compact={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
