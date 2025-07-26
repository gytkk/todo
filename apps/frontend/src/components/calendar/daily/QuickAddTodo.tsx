"use client";

import React, { useState, useEffect } from 'react';
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
  disabled = false
}) => {
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // 카테고리 목록이 로드되면 초기화
  useEffect(() => {
    if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
      setIsInitialized(true);
    } else if (isInitialized) {
      // 이미 초기화된 상태에서 카테고리가 사라진 경우에만 에러 로그
      console.error('카테고리가 존재하지 않습니다. 설정에서 카테고리를 추가해주세요.');
      setSelectedCategoryId('');
    }
  }, [categories, isInitialized]);

  // 아직 초기화되지 않은 상태 (로딩 중)
  if (!isInitialized && categories.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="animate-pulse">
          <div className="flex gap-2 mb-3">
            <div className="flex-1 h-10 bg-gray-200 rounded-md"></div>
            <div className="w-16 h-10 bg-gray-200 rounded-md"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-24 h-8 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // 초기화된 후에도 카테고리가 없는 경우 (실제 에러 상황)
  if (isInitialized && categories.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-red-50 border-red-200">
        <div className="text-red-600 text-sm font-medium">
          ⚠️ 카테고리가 존재하지 않습니다
        </div>
        <div className="text-red-500 text-xs mt-1">
          설정에서 카테고리를 추가해주세요.
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (title.trim() && selectedCategoryId) {
      onAddTodo(title.trim(), selectedCategoryId);
      setTitle("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
    if (e.key === "Escape") {
      setTitle("");
    }
  };


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
          />
          <Button 
            onClick={handleSubmit} 
            disabled={disabled || !title.trim()}
            className="px-4 h-10"
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

      </div>
    </div>
  );
};