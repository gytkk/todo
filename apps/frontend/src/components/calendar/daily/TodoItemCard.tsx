"use client";

import React from 'react';
import { TodoItem } from '@calendar-todo/shared-types';
import { UnifiedTodoItem } from '../../todo/UnifiedTodoItem';

interface TodoItemCardProps {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  compact?: boolean;
}

export const TodoItemCard: React.FC<TodoItemCardProps> = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
  compact = false
}) => {
  return (
    <UnifiedTodoItem
      todo={todo}
      onToggle={onToggle}
      onDelete={onDelete}
      onEdit={onEdit}
      compact={compact}
      variant="daily"
      preventEventBubbling={true}
    />
  );
};