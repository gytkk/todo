"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { TodoItem, TodoStats, TodoCategory } from '@calendar-todo/shared-types';
import { useTodos } from '@/hooks/useTodos';

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
  categories: TodoCategory[];
}

export function TodoProvider({ children, categories }: TodoProviderProps) {
  const todoHook = useTodos(categories);

  const contextValue: TodoContextType = {
    ...todoHook,
  };

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