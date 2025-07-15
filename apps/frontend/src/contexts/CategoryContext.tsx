"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { TodoCategory, CategoryFilter, TodoItem } from '@calendar-todo/shared-types';
import { useCategories } from '@/hooks/useCategories';

interface CategoryContextType {
  // Category related
  categories: TodoCategory[];
  categoryFilter: CategoryFilter;
  loading: boolean;
  setCategoryFilter: React.Dispatch<React.SetStateAction<CategoryFilter>>;
  toggleCategoryFilter: (categoryId: string) => Promise<boolean>;
  getFilteredTodos: (todos: TodoItem[]) => TodoItem[];
  addCategory: (name: string, color: string) => Promise<TodoCategory | null>;
  updateCategory: (id: string, updates: { name?: string; color?: string }) => Promise<boolean>;
  deleteCategory: (id: string, todos: TodoItem[]) => Promise<boolean>;
  getCategoryById: (id: string) => TodoCategory | undefined;
  getAvailableColors: () => Promise<string[]>;
  loadCategories: () => Promise<void>;
  refreshCategories: () => Promise<void>; // 강제 새로고침 함수 추가
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

interface CategoryProviderProps {
  children: ReactNode;
}

export function CategoryProvider({ children }: CategoryProviderProps) {
  const categoryHook = useCategories();

  // 강제 새로고침 함수
  const refreshCategories = useCallback(async () => {
    await categoryHook.loadCategories();
  }, [categoryHook.loadCategories]);

  const contextValue: CategoryContextType = useMemo(() => ({
    ...categoryHook,
    refreshCategories,
  }), [categoryHook, refreshCategories]);

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
}