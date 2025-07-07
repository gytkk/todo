"use client";

import React, { useState } from 'react';
import { Button } from "@calendar-todo/ui";
import { CategorySelector } from "@/components/categories/CategorySelector";
import { TodoCategory } from '@calendar-todo/shared-types';
import { Plus } from 'lucide-react';

interface QuickAddTodoProps {
  onAddTodo: (title: string, categoryId: string) => void;
  categories: TodoCategory[];
  disabled?: boolean;
  compact?: boolean;
}

export const QuickAddTodo: React.FC<QuickAddTodoProps> = ({
  onAddTodo,
  categories,
  disabled = false,
  compact = false
}) => {
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "personal");
  const [isExpanded, setIsExpanded] = useState(!compact);

  const handleSubmit = () => {
    if (title.trim() && selectedCategoryId) {
      onAddTodo(title.trim(), selectedCategoryId);
      setTitle("");
      if (compact) {
        setIsExpanded(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
    if (e.key === "Escape") {
      setTitle("");
      if (compact) {
        setIsExpanded(false);
      }
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  if (compact && !isExpanded) {
    return (
      <Button
        variant="outline"
        onClick={handleExpand}
        disabled={disabled}
        className="w-full flex items-center gap-2 text-gray-500 border-dashed"
      >
        <Plus className="h-4 w-4" />
        할일 추가
      </Button>
    );
  }

  return (
    <div className={`border rounded-lg p-4 bg-gray-50 ${disabled ? 'opacity-50' : ''}`}>
      <div className="space-y-3">
        {/* 할일 입력 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="새 할일을 입력하세요"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            onKeyPress={handleKeyPress}
            disabled={disabled}
            autoFocus={isExpanded}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={disabled || !title.trim()}
            className="px-4"
          >
            <Plus className="h-4 w-4 mr-1" />
            추가
          </Button>
        </div>

        {/* 카테고리 선택 */}
        <CategorySelector
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          disabled={disabled}
        />

        {/* 컴팩트 모드에서 취소 버튼 */}
        {compact && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(false);
                setTitle("");
              }}
              className="text-gray-500"
            >
              취소
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};