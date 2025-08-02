"use client";

import React, { memo, useCallback } from 'react';
import { Button, Switch } from "@calendar-todo/ui";
import { TodoItem as TodoItemType } from '@calendar-todo/shared-types';
import { Trash2, Edit3, Calendar, Target } from 'lucide-react';

interface UnifiedTodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onTypeChange?: (id: string, newType: 'event' | 'task') => void;
  compact?: boolean;
  preventEventBubbling?: boolean;
  variant?: 'sidebar' | 'daily' | 'auto';
  recentlyMoved?: boolean;
}

function UnifiedTodoItemComponent({ 
  todo, 
  onToggle, 
  onDelete, 
  onEdit,
  onTypeChange,
  compact = false,
  preventEventBubbling = false,
  recentlyMoved = false,
  // variant = 'auto'
}: UnifiedTodoItemProps) {
  const handleToggle = useCallback(() => {
    onToggle(todo.id);
  }, [todo.id, onToggle]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    if (preventEventBubbling) {
      e.stopPropagation();
    }
    onDelete(todo.id);
  }, [todo.id, onDelete, preventEventBubbling]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    if (preventEventBubbling) {
      e.stopPropagation();
    }
    if (onEdit) {
      onEdit(todo.id);
    }
  }, [todo.id, onEdit, preventEventBubbling]);

  const handleTypeChange = useCallback((e: React.MouseEvent) => {
    if (preventEventBubbling) {
      e.stopPropagation();
    }
    if (onTypeChange) {
      onTypeChange(todo.id, todo.todoType === 'event' ? 'task' : 'event');
    }
  }, [todo.id, todo.todoType, onTypeChange, preventEventBubbling]);

  return (
    <div
      className={`group border rounded-lg transition-all duration-200 ${
        recentlyMoved
          ? 'bg-green-50 border-green-200 ring-2 ring-green-100'
          : todo.completed
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${
        compact ? 'p-1.5' : 'p-2'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* 카테고리 색상 표시 */}
        <div
          className={`w-1 rounded-full flex-shrink-0 ${
            compact ? 'h-5' : 'h-6'
          }`}
          style={{ backgroundColor: todo.category.color }}
        />

        {/* 체크박스 */}
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={handleToggle}
            className="h-4 w-4 focus:ring-1 border-gray-300 rounded appearance-none cursor-pointer flex-shrink-0"
            style={{
              backgroundColor: todo.completed ? todo.category.color : 'transparent',
              borderColor: todo.category.color,
              borderWidth: '2px'
            }}
          />
          {todo.completed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg 
                className="w-3 h-3 text-white" 
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
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
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {/* 배지 스타일 타입 Switch */}
          <div className={`relative inline-flex items-center rounded-full text-xs font-medium transition-all cursor-pointer ${
            compact ? 'px-2 py-0.5' : 'px-3 py-1'
          } bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200`}
            onClick={handleTypeChange}
            title={`클릭하여 ${todo.todoType === 'event' ? '작업' : '이벤트'}으로 변경`}
          >
            {onTypeChange && (
              <Switch 
                checked={todo.todoType === 'event'}
                className="absolute inset-0 opacity-0 w-full h-full sr-only"
                onCheckedChange={(checked) => onTypeChange(todo.id, checked ? 'event' : 'task')}
              />
            )}
            {todo.todoType === 'event' ? (
              <>
                <Calendar className={`mr-1 ${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                이벤트
              </>
            ) : (
              <>
                <Target className={`mr-1 ${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                작업
              </>
            )}
          </div>
          
          {/* Recently moved 표시 */}
          {recentlyMoved && (
            <span 
              className={`flex-shrink-0 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium ${
                compact ? 'text-xs' : 'text-xs'
              }`}
              title="최근 자동 이동된 작업"
            >
              이동됨
            </span>
          )}
          
          <span
            className={`font-medium transition-colors ${
              todo.completed
                ? 'line-through text-gray-500'
                : recentlyMoved
                ? 'text-green-800'
                : 'text-gray-900'
            } ${
              compact ? 'text-sm' : 'text-base'
            }`}
          >
            {todo.title}
          </span>
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
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              title="할일 수정"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            title="할일 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export const UnifiedTodoItem = memo(UnifiedTodoItemComponent);