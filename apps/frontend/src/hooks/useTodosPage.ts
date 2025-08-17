import { useState, useEffect, useMemo, useCallback } from 'react';
import { TodoItem } from '@calendar-todo/shared-types';

export type CompletionFilter = 'all' | 'completed' | 'incomplete';
export type TodoTypeFilter = 'all' | 'event' | 'task';
export type SortOption = 'date' | 'category' | 'completion' | 'created';
export type SortOrder = 'asc' | 'desc';

interface FilterState {
  completion: CompletionFilter;
  todoType: TodoTypeFilter;
  categoryIds: string[];
  searchQuery: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface SortState {
  option: SortOption;
  order: SortOrder;
}

const STORAGE_KEY = 'todos-page-settings';

interface StoredSettings {
  filters: FilterState;
  sort: SortState;
}

const defaultFilters: FilterState = {
  completion: 'all',
  todoType: 'all',
  categoryIds: [],
  searchQuery: '',
  dateRange: {
    start: null,
    end: null,
  },
};

const defaultSort: SortState = {
  option: 'date',
  order: 'desc',
};

export function useTodosPage(todos: TodoItem[]) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState<SortState>(defaultSort);

  // 로컬 스토리지에서 설정 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings: StoredSettings = JSON.parse(stored);
        setFilters(settings.filters || defaultFilters);
        setSort(settings.sort || defaultSort);
      }
    } catch (error) {
      console.warn('Failed to load todos page settings:', error);
    }
  }, []);

  // 설정 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    try {
      const settings: StoredSettings = { filters, sort };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save todos page settings:', error);
    }
  }, [filters, sort]);

  // 필터링된 할 일 목록
  const filteredTodos = useMemo(() => {
    let result = [...todos];

    // 완료 상태 필터
    if (filters.completion === 'completed') {
      result = result.filter(todo => todo.completed);
    } else if (filters.completion === 'incomplete') {
      result = result.filter(todo => !todo.completed);
    }

    // 할 일 타입 필터
    if (filters.todoType === 'event') {
      result = result.filter(todo => todo.todoType === 'event');
    } else if (filters.todoType === 'task') {
      result = result.filter(todo => todo.todoType === 'task');
    }

    // 카테고리 필터
    if (filters.categoryIds.length > 0) {
      result = result.filter(todo => filters.categoryIds.includes(todo.category.id));
    }

    // 검색 필터
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter(todo => 
        todo.title.toLowerCase().includes(query)
      );
    }

    // 날짜 범위 필터
    if (filters.dateRange.start && filters.dateRange.end) {
      const start = new Date(filters.dateRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.dateRange.end);
      end.setHours(23, 59, 59, 999);

      result = result.filter(todo => {
        const todoDate = new Date(todo.date);
        return todoDate >= start && todoDate <= end;
      });
    }

    return result;
  }, [todos, filters]);

  // 정렬된 할 일 목록
  const sortedTodos = useMemo(() => {
    const result = [...filteredTodos];

    result.sort((a, b) => {
      let comparison = 0;

      switch (sort.option) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'category':
          comparison = a.category.name.localeCompare(b.category.name);
          break;
        case 'completion':
          comparison = Number(a.completed) - Number(b.completed);
          break;
        case 'created':
          // createdAt이 없는 경우 date를 사용
          const aCreated = new Date(a.date).getTime();
          const bCreated = new Date(b.date).getTime();
          comparison = aCreated - bCreated;
          break;
        default:
          comparison = 0;
      }

      return sort.order === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [filteredTodos, sort]);

  // 필터 업데이트 함수들
  const updateCompletionFilter = useCallback((completion: CompletionFilter) => {
    setFilters(prev => ({ ...prev, completion }));
  }, []);

  const updateTodoTypeFilter = useCallback((todoType: TodoTypeFilter) => {
    setFilters(prev => ({ ...prev, todoType }));
  }, []);

  const updateCategoryFilter = useCallback((categoryIds: string[]) => {
    setFilters(prev => ({ ...prev, categoryIds }));
  }, []);

  const updateSearchQuery = useCallback((searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, []);

  const updateDateRange = useCallback((start: Date | null, end: Date | null) => {
    setFilters(prev => ({ 
      ...prev, 
      dateRange: { start, end } 
    }));
  }, []);

  // 정렬 업데이트 함수들
  const updateSort = useCallback((option: SortOption, order: SortOrder) => {
    setSort({ option, order });
  }, []);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // 통계
  const stats = useMemo(() => {
    return {
      total: sortedTodos.length,
      originalTotal: todos.length,
      completed: sortedTodos.filter(todo => todo.completed).length,
      incomplete: sortedTodos.filter(todo => !todo.completed).length,
    };
  }, [sortedTodos, todos]);

  return {
    // 데이터
    todos: sortedTodos,
    stats,
    
    // 현재 상태
    filters,
    sort,
    
    // 업데이트 함수들
    updateCompletionFilter,
    updateTodoTypeFilter,
    updateCategoryFilter,
    updateSearchQuery,
    updateDateRange,
    updateSort,
    resetFilters,
  };
}