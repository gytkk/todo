"use client";

import { memo } from 'react';
import { Button } from '@calendar-todo/ui';
import { Filter, X } from 'lucide-react';
import { CompletionFilter, TodoTypeFilter } from '@/hooks/useTodosPage';
import { TodoCategory } from '@calendar-todo/shared-types';

interface TodosFilterProps {
  // 현재 필터 상태
  completionFilter: CompletionFilter;
  todoTypeFilter: TodoTypeFilter;
  categoryIds: string[];
  
  // 데이터
  categories: TodoCategory[];
  
  // 업데이트 함수들
  onCompletionFilterChange: (filter: CompletionFilter) => void;
  onTodoTypeFilterChange: (filter: TodoTypeFilter) => void;
  onCategoryFilterChange: (categoryIds: string[]) => void;
  onResetFilters: () => void;
  
  // UI 상태
  className?: string;
}

function TodosFilterComponent({
  completionFilter,
  todoTypeFilter,
  categoryIds,
  categories,
  onCompletionFilterChange,
  onTodoTypeFilterChange,
  onCategoryFilterChange,
  onResetFilters,
  className = '',
}: TodosFilterProps) {
  
  // 카테고리 토글
  const toggleCategory = (categoryId: string) => {
    if (categoryIds.includes(categoryId)) {
      onCategoryFilterChange(categoryIds.filter(id => id !== categoryId));
    } else {
      onCategoryFilterChange([...categoryIds, categoryId]);
    }
  };

  // 활성 필터 개수 계산
  const activeFilterCount = 
    (completionFilter !== 'all' ? 1 : 0) +
    (todoTypeFilter !== 'all' ? 1 : 0) +
    categoryIds.length;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">필터</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* 완료 상태 필터 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          완료 상태
        </label>
        <div className="flex gap-2">
          <Button
            variant={completionFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCompletionFilterChange('all')}
          >
            전체
          </Button>
          <Button
            variant={completionFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCompletionFilterChange('completed')}
          >
            완료
          </Button>
          <Button
            variant={completionFilter === 'incomplete' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCompletionFilterChange('incomplete')}
          >
            미완료
          </Button>
        </div>
      </div>

      {/* 할 일 타입 필터 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          할 일 타입
        </label>
        <div className="flex gap-2">
          <Button
            variant={todoTypeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTodoTypeFilterChange('all')}
          >
            전체
          </Button>
          <Button
            variant={todoTypeFilter === 'event' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTodoTypeFilterChange('event')}
          >
            이벤트
          </Button>
          <Button
            variant={todoTypeFilter === 'task' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTodoTypeFilterChange('task')}
          >
            작업
          </Button>
        </div>
      </div>

      {/* 카테고리 필터 */}
      {categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={categoryIds.includes(category.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleCategory(category.id)}
                className="flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const TodosFilter = memo(TodosFilterComponent);