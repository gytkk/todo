"use client";

import { Button } from "@calendar-todo/ui";
import { TodoItem as TodoItemType } from '@/types';
import { memo, useCallback } from 'react';

interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TodoItemComponent({ todo, onToggle, onDelete }: TodoItemProps) {
  const handleToggle = useCallback(() => {
    onToggle(todo.id);
  }, [todo.id, onToggle]);

  const handleDelete = useCallback(() => {
    onDelete(todo.id);
  }, [todo.id, onDelete]);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        todo.completed
          ? "bg-gray-50 border-gray-100"
          : "bg-white border-gray-200"
      }`}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <span
        className={`flex-1 ${
          todo.completed
            ? "line-through text-gray-500"
            : "text-gray-900"
        }`}
      >
        {todo.title}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        className="text-gray-500 hover:text-gray-700"
      >
        삭제
      </Button>
    </div>
  );
}

export const TodoItem = memo(TodoItemComponent);