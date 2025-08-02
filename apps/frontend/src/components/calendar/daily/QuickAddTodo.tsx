"use client";

import React, { useState, useEffect } from 'react';
import { Button, Switch } from "@calendar-todo/ui";
import { CategorySelector } from "@/components/categories/CategorySelector";
import { TodoCategory, TodoType } from '@calendar-todo/shared-types';
import { Plus, Calendar, Target } from 'lucide-react';

// 세그먼트 컨트롤 비율 상수
const SEGMENT_RATIOS = {
  EVENT: 53, // 이벤트 버튼 비율 (%)
  TASK: 47,  // 작업 버튼 비율 (%)
} as const;

interface QuickAddTodoProps {
  onAddTodo: (title: string, categoryId: string, todoType: TodoType) => void;
  categories: TodoCategory[];
  disabled?: boolean;
  compact?: boolean;
  date: Date;
}

export const QuickAddTodo: React.FC<QuickAddTodoProps> = ({
  onAddTodo,
  categories,
  disabled = false,
  date
}) => {
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedTodoType, setSelectedTodoType] = useState<TodoType>("event");
  const [isInitialized, setIsInitialized] = useState(false);

  // 날짜를 기반으로 고유한 ID prefix 생성 (향후 필요시 사용)
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식

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
      onAddTodo(title.trim(), selectedCategoryId, selectedTodoType);
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

        {/* 카테고리 선택 및 타입 선택 */}
        <div className="flex items-center justify-between gap-4">
          <CategorySelector
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            disabled={disabled}
          />
          
          <div className="relative inline-flex bg-gray-100 rounded-lg p-1 whitespace-nowrap">
            {/* 숨겨진 스위치 (기능은 유지) */}
            <Switch
              id={`todo-type-switch-${dateString}`}
              checked={selectedTodoType === "task"}
              onCheckedChange={(checked) => setSelectedTodoType(checked ? "task" : "event")}
              disabled={disabled}
              className="absolute opacity-0 pointer-events-none"
            />
            
            {/* 슬라이딩 배경 */}
            <div 
              className="absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-200 ease-in-out"
              style={{
                left: '0.25rem', // left-1과 동일
                right: selectedTodoType === "event" 
                  ? `${SEGMENT_RATIOS.TASK}%` 
                  : '0.25rem', // right-1과 동일
                ...(selectedTodoType === "task" && { left: `${SEGMENT_RATIOS.EVENT}%` })
              }}
            />
            
            {/* 이벤트 버튼 */}
            <button
              type="button"
              onClick={() => setSelectedTodoType("event")}
              disabled={disabled}
              className={`relative z-10 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-1 ${
                selectedTodoType === "event"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
              style={{ flexBasis: `${SEGMENT_RATIOS.EVENT}%` }}
            >
              <Calendar className="h-3.5 w-3.5" />
              이벤트
            </button>
            
            {/* 작업 버튼 */}
            <button
              type="button"
              onClick={() => setSelectedTodoType("task")}
              disabled={disabled}
              className={`relative z-10 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-1 ${
                selectedTodoType === "task"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
              style={{ flexBasis: `${SEGMENT_RATIOS.TASK}%` }}
            >
              <Target className="h-3.5 w-3.5" />
              작업
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};