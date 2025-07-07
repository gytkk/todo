import { useState, useCallback, useEffect } from 'react';
import { TodoCategory, CategoryFilter } from '@calendar-todo/shared-types';
import { TodoItem } from '@calendar-todo/shared-types';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS, STORAGE_KEYS } from '@/constants/categories';

export const useCategories = () => {
  // localStorage에서 카테고리 로드 (기본 카테고리 + 사용자 정의)
  const [categories, setCategories] = useState<TodoCategory[]>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_CATEGORIES;
    }

    const stored = localStorage.getItem(STORAGE_KEYS.USER_CATEGORIES);
    const userCategories = stored ? JSON.parse(stored).map((cat: TodoCategory) => ({
      ...cat,
      createdAt: new Date(cat.createdAt)
    })) : [];
    return [...DEFAULT_CATEGORIES, ...userCategories];
  });

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(() => {
    if (typeof window === 'undefined') {
      // 기본 상태: 모든 카테고리 선택
      const defaultFilter: CategoryFilter = {};
      DEFAULT_CATEGORIES.forEach(cat => {
        defaultFilter[cat.id] = true;
      });
      return defaultFilter;
    }

    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORY_FILTER);
    if (stored) {
      return JSON.parse(stored);
    }
    // 기본 상태: 모든 카테고리 선택
    const defaultFilter: CategoryFilter = {};
    [...DEFAULT_CATEGORIES].forEach(cat => {
      defaultFilter[cat.id] = true;
    });
    return defaultFilter;
  });

  // 카테고리 추가
  const addCategory = useCallback((name: string, color: string): TodoCategory => {
    const newCategory: TodoCategory = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      color,
      isDefault: false,
      createdAt: new Date()
    };

    setCategories(prev => {
      const updated = [...prev, newCategory];
      // 사용자 정의 카테고리만 저장
      const userCategories = updated.filter(cat => !cat.isDefault);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER_CATEGORIES, JSON.stringify(userCategories));
      }
      return updated;
    });

    // 새 카테고리는 기본적으로 필터에 포함
    setCategoryFilter(prev => {
      const updated = {
        ...prev,
        [newCategory.id]: true
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CATEGORY_FILTER, JSON.stringify(updated));
      }
      return updated;
    });

    return newCategory;
  }, []);

  // 카테고리 수정
  const updateCategory = useCallback((id: string, updates: Partial<TodoCategory>) => {
    setCategories(prev => {
      const updated = prev.map(cat =>
        cat.id === id ? { ...cat, ...updates } : cat
      );
      // 사용자 정의 카테고리만 저장
      const userCategories = updated.filter(cat => !cat.isDefault);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER_CATEGORIES, JSON.stringify(userCategories));
      }
      return updated;
    });
  }, []);

  // 카테고리 삭제
  const deleteCategory = useCallback((id: string, todos: TodoItem[]): boolean => {
    const category = categories.find(cat => cat.id === id);

    // 기본 카테고리는 삭제 불가
    if (!category || category.isDefault) {
      return false;
    }

    // 해당 카테고리를 사용하는 할일이 있는지 확인
    const relatedTodos = todos.filter(todo => todo.category.id === id);
    if (relatedTodos.length > 0) {
      const confirmed = window.confirm(
        `"${category.name}" 카테고리에 ${relatedTodos.length}개의 할일이 있습니다. 정말 삭제하시겠습니까?\n관련된 할일들은 "개인" 카테고리로 이동됩니다.`
      );
      if (!confirmed) {
        return false;
      }
    }

    setCategories(prev => {
      const updated = prev.filter(cat => cat.id !== id);
      // 사용자 정의 카테고리만 저장
      const userCategories = updated.filter(cat => !cat.isDefault);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER_CATEGORIES, JSON.stringify(userCategories));
      }
      return updated;
    });

    // 필터에서도 제거
    setCategoryFilter(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...rest } = prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CATEGORY_FILTER, JSON.stringify(rest));
      }
      return rest;
    });

    return true;
  }, [categories]);

  // 사용 가능한 색상 반환 (이미 사용된 색상 제외)
  const getAvailableColors = useCallback(() => {
    const usedColors = categories.map(cat => cat.color);
    return CATEGORY_COLORS.filter(color => !usedColors.includes(color));
  }, [categories]);

  const toggleCategoryFilter = useCallback((categoryId: string) => {
    setCategoryFilter(prev => {
      const updated = {
        ...prev,
        [categoryId]: !prev[categoryId]
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CATEGORY_FILTER, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const getFilteredTodos = useCallback((todos: TodoItem[]) => {
    return todos.filter(todo => categoryFilter[todo.category?.id] !== false);
  }, [categoryFilter]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  // 새 카테고리가 추가될 때 필터에 자동 추가
  useEffect(() => {
    const newCategoryIds = categories
      .map(cat => cat.id)
      .filter(id => !(id in categoryFilter));

    if (newCategoryIds.length > 0) {
      setCategoryFilter(prev => {
        const updated = { ...prev };
        newCategoryIds.forEach(id => {
          updated[id] = true;
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.CATEGORY_FILTER, JSON.stringify(updated));
        }
        return updated;
      });
    }
  }, [categories, categoryFilter]);

  return {
    categories,
    categoryFilter,
    setCategoryFilter,
    toggleCategoryFilter,
    getFilteredTodos,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getAvailableColors,
  };
};
