"use client";

import { TodoItem as TodoItemType } from '@calendar-todo/shared-types';
import { memo } from 'react';
import { UnifiedTodoItem } from './UnifiedTodoItem';

interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TodoItemComponent({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <UnifiedTodoItem
      todo={todo}
      onToggle={onToggle}
      onDelete={onDelete}
      compact={false}
      variant="sidebar"
    />
  );
}

export const TodoItem = memo(TodoItemComponent);