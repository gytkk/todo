"use client";

import { Button } from "@calendar-todo/ui";
import { TodoItem as TodoItemType } from '@calendar-todo/shared-types';
import { memo, useCallback } from 'react';
import { getCategoryBackgroundColor } from '@/utils/colorUtils';
import { X } from 'lucide-react';

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

  // Get category background color
  const categoryBackgroundColor = getCategoryBackgroundColor(
    todo.category.color, 
    todo.completed
  );

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg border ${
        todo.completed
          ? "border-gray-100"
          : "border-gray-200"
      }`}
      style={{
        backgroundColor: categoryBackgroundColor
      }}
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
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export const TodoItem = memo(TodoItemComponent);