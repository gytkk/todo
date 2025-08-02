"use client";

import { TodoItem as TodoItemType } from '@calendar-todo/shared-types';
import { memo } from 'react';
import { UnifiedTodoItem } from './UnifiedTodoItem';

interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onTypeChange?: (id: string, newType: 'event' | 'task') => void;
}

function TodoItemComponent({ todo, onToggle, onDelete, onTypeChange }: TodoItemProps) {
  return (
    <UnifiedTodoItem
      todo={todo}
      onToggle={onToggle}
      onDelete={onDelete}
      onTypeChange={onTypeChange}
      compact={false}
      variant="sidebar"
    />
  );
}

export const TodoItem = memo(TodoItemComponent);