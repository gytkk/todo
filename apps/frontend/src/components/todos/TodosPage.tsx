"use client";

import { memo, useMemo } from 'react';
import { useTodoContext, useCategoryContext } from '@/contexts/AppContext';
import { useTodosPage } from '@/hooks/useTodosPage';
import { TodoList } from '@/components/todo/TodoList';
import { TodoStats } from '@/components/todo/TodoStats';
import { TodosFilter } from './TodosFilter';
import { TodosSearch } from './TodosSearch';
import { TodosView } from './TodosView';

interface TodosPageProps {
  className?: string;
}

function TodosPageComponent({ className = '' }: TodosPageProps) {
  const { todos, toggleTodo, deleteTodo, updateTodo } = useTodoContext();
  const { categories } = useCategoryContext();

  // 필터링 및 정렬 로직
  const {
    todos: filteredTodos,
    stats: filteredStats,
    filters,
    sort,
    updateCompletionFilter,
    updateTodoTypeFilter,
    updateCategoryFilter,
    updateSearchQuery,
    updateSort,
    resetFilters,
  } = useTodosPage(todos);

  // 전체 할 일 통계 계산 (필터링 전)
  const totalStats = useMemo(() => {
    const eventTodos = todos.filter(t => t.todoType === 'event');
    const taskTodos = todos.filter(t => t.todoType === 'task');

    return {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      incomplete: todos.filter(t => !t.completed).length,
      completionRate: todos.length > 0 ? (todos.filter(t => t.completed).length / todos.length) * 100 : 0,
      recentCompletions: 0,
      byType: {
        event: {
          total: eventTodos.length,
          completed: eventTodos.filter(t => t.completed).length,
          incomplete: eventTodos.filter(t => !t.completed).length,
        },
        task: {
          total: taskTodos.length,
          completed: taskTodos.filter(t => t.completed).length,
          incomplete: taskTodos.filter(t => !t.completed).length,
        },
      },
    };
  }, [todos]);

  // 할 일 타입 변경 핸들러
  const handleTypeChange = (id: string, newType: 'event' | 'task') => {
    updateTodo(id, { todoType: newType });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 통계 섹션 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">할 일 요약</h2>
        <TodoStats stats={totalStats} />

        {filteredStats.total !== filteredStats.originalTotal && (
          <div className="mt-2 text-sm text-gray-600">
            필터 적용: {filteredStats.total}개 / {filteredStats.originalTotal}개
          </div>
        )}
      </div>

      {/* 검색 및 필터 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 검색 */}
        <div className="lg:col-span-1">
          <TodosSearch
            searchQuery={filters.searchQuery}
            onSearchChange={updateSearchQuery}
          />
        </div>

        {/* 필터 */}
        <div className="lg:col-span-2">
          <TodosFilter
            completionFilter={filters.completion}
            todoTypeFilter={filters.todoType}
            categoryIds={filters.categoryIds}
            categories={categories}
            onCompletionFilterChange={updateCompletionFilter}
            onTodoTypeFilterChange={updateTodoTypeFilter}
            onCategoryFilterChange={updateCategoryFilter}
            onResetFilters={resetFilters}
          />
        </div>
      </div>

      {/* 정렬 및 뷰 옵션 */}
      <TodosView
        sortOption={sort.option}
        sortOrder={sort.order}
        totalCount={filteredStats.originalTotal}
        filteredCount={filteredStats.total}
        onSortChange={updateSort}
      />

      {/* 할 일 목록 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            할 일 목록
          </h2>
        </div>

        {filteredTodos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filters.searchQuery || filters.completion !== 'all' || filters.todoType !== 'all' || filters.categoryIds.length > 0
                ? '조건에 맞는 할 일이 없습니다'
                : '할 일이 없습니다'
              }
            </h3>
            <p className="text-gray-500">
              {filters.searchQuery || filters.completion !== 'all' || filters.todoType !== 'all' || filters.categoryIds.length > 0
                ? '다른 필터 조건을 시도해보세요.'
                : '새로운 할 일을 추가해보세요.'
              }
            </p>
          </div>
        ) : (
          <TodoList
            todos={filteredTodos}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
            onTypeChange={handleTypeChange}
            emptyMessage="조건에 맞는 할 일이 없습니다"
          />
        )}
      </div>
    </div>
  );
}

export const TodosPage = memo(TodosPageComponent);
