"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { TodoItem, TodoStats } from '@calendar-todo/shared-types';
import { useTodos } from '@/hooks/useTodos';
import { useCategoryContext } from './CategoryContext';

interface TodoContextType {
  // Todo related
  todos: TodoItem[];
  addTodo: (title: string, date: Date, categoryId: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearAllTodos: () => void;
  getTodosByDate: (date: Date) => TodoItem[];
  getTodoStats: () => TodoStats;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

interface TodoProviderProps {
  children: ReactNode;
}

export function TodoProvider({ children }: TodoProviderProps) {
  const { categories } = useCategoryContext();
  const todoHook = useTodos(categories);

  const contextValue: TodoContextType = useMemo(() => ({
    ...todoHook,
  }), [todoHook]);

  return (
    <TodoContext.Provider value={contextValue}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodoContext() {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodoContext must be used within a TodoProvider');
  }
  return context;
}