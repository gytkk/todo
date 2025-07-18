"use client";

import React from 'react';
import { Button } from "@calendar-todo/ui";
import { TodoItem } from '@calendar-todo/shared-types';
import { Trash2, Edit3 } from 'lucide-react';

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
  const handleToggle = () => {
    onToggle(todo.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(todo.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(todo.id);
    }
  };

  return (
    <div
      className={`group border rounded-lg transition-all duration-200 ${
        todo.completed
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-center gap-3">
        {/* 카테고리 색상 표시 */}
        <div
          className={`w-1 rounded-full flex-shrink-0 ${compact ? 'h-8' : 'h-10'}`}
          style={{ backgroundColor: todo.category.color }}
        />

        {/* 체크박스 */}
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={handleToggle}
            className="h-5 w-5 focus:ring-2 border-gray-300 rounded appearance-none cursor-pointer flex-shrink-0"
            style={{
              backgroundColor: todo.completed ? todo.category.color : 'transparent',
              borderColor: todo.category.color,
              borderWidth: '2px'
            }}
          />
          {todo.completed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg 
                className="w-4 h-4 text-white" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>

        {/* 할일 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`font-medium transition-colors ${
                todo.completed
                  ? 'line-through text-gray-500'
                  : 'text-gray-900'
              } ${compact ? 'text-sm' : 'text-base'}`}
            >
              {todo.title}
            </span>
            
            {/* 카테고리 뱃지 */}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                todo.completed ? 'opacity-60' : ''
              }`}
              style={{
                backgroundColor: `${todo.category.color}20`,
                color: todo.category.color
              }}
            >
              {todo.category.name}
            </span>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          compact ? '' : 'ml-2'
        }`}>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              title="할일 수정"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
            title="할일 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};