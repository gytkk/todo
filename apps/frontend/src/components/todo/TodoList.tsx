"use client";

import { TodoItem as TodoItemType } from '@calendar-todo/shared-types';
import { TodoItem } from './TodoItem';
import { memo } from 'react';

interface TodoListProps {
  todos: TodoItemType[];
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  emptyMessage?: string;
}

function TodoListComponent({ 
  todos, 
  onToggleTodo, 
  onDeleteTodo, 
  emptyMessage = "할일이 없습니다" 
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggleTodo}
          onDelete={onDeleteTodo}
        />
      ))}
    </div>
  );
}

export const TodoList = memo(TodoListComponent);