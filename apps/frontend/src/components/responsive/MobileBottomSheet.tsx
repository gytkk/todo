"use client";

import { useRef, useEffect, useCallback } from 'react';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button, Badge } from "@calendar-todo/ui";
import { TodoForm } from '@/components/todo/TodoForm';
import { TodoList } from '@/components/todo/TodoList';
import { TodoStats } from '@/components/todo/TodoStats';
import { useTodoContext, useCategoryContext } from '@/contexts/AppContext';
import { useMemo } from 'react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  selectedDate: Date | undefined;
  onClose: () => void;
}

export const MobileBottomSheet = ({ isOpen, selectedDate, onClose }: MobileBottomSheetProps) => {
  const { addTodo, toggleTodo, deleteTodo, getTodosByDate } = useTodoContext();
  const { categories } = useCategoryContext();
  const sheetRef = useRef<HTMLDivElement>(null);

  const selectedDateTodos = useMemo(() => {
    return selectedDate ? getTodosByDate(selectedDate) : [];
  }, [selectedDate, getTodosByDate]);

  const stats = useMemo(() => ({
    total: selectedDateTodos.length,
    completed: selectedDateTodos.filter(t => t.completed).length,
    incomplete: selectedDateTodos.filter(t => !t.completed).length,
    completionRate: 0,
    recentCompletions: 0,
  }), [selectedDateTodos]);

  const handleAddTodo = useCallback((title: string, categoryId: string) => {
    if (selectedDate) {
      addTodo(title, selectedDate, categoryId);
    }
  }, [selectedDate, addTodo]);

  // ESC 키 처리
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // 배경 클릭 시 닫기
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <>
      {/* 배경 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleBackgroundClick}
        />
      )}
      
      {/* 바텀 시트 */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh' }}
      >
        <div className="flex flex-col h-full">
          {/* 핸들 */}
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold">
              {selectedDate
                ? `${format(selectedDate, "MM월 dd일", { locale: ko })} 할일`
                : "할일 목록"}
              {selectedDateTodos.length > 0 && (
                <Badge className="ml-2">
                  {selectedDateTodos.length}
                </Badge>
              )}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <span aria-hidden="true">✕</span>
            </Button>
          </div>

          {/* 컨텐츠 */}
          <div className="flex-1 flex flex-col space-y-4 p-4 overflow-hidden">
            <TodoForm onAddTodo={handleAddTodo} categories={categories} disabled={!selectedDate} />
            
            <div className="flex-1 overflow-y-auto">
              <TodoList
                todos={selectedDateTodos}
                onToggleTodo={toggleTodo}
                onDeleteTodo={deleteTodo}
                emptyMessage={
                  selectedDate
                    ? "이 날짜에 등록된 할일이 없습니다"
                    : "날짜를 선택해주세요"
                }
              />
            </div>

            <TodoStats stats={stats} />
          </div>
        </div>
      </div>
    </>
  );
};