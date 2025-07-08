"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { TodoCategory, CategoryFilter, TodoItem } from '@calendar-todo/shared-types';
import { useCategories } from '@/hooks/useCategories';

interface CategoryContextType {
  // Category related
  categories: TodoCategory[];
  categoryFilter: CategoryFilter;
  toggleCategoryFilter: (categoryId: string) => void;
  getFilteredTodos: (todos: TodoItem[]) => TodoItem[];
  addCategory: (name: string, color: string) => TodoCategory;
  updateCategory: (id: string, updates: Partial<TodoCategory>) => void;
  deleteCategory: (id: string, todos: TodoItem[]) => boolean;
  getCategoryById: (id: string) => TodoCategory | undefined;
  getAvailableColors: () => string[];
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

interface CategoryProviderProps {
  children: ReactNode;
}

export function CategoryProvider({ children }: CategoryProviderProps) {
  const categoryHook = useCategories();

  const contextValue: CategoryContextType = {
    ...categoryHook,
  };

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