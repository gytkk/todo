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

interface TabletSidePanelProps {
  isOpen: boolean;
  selectedDate: Date | undefined;
  onClose: () => void;
}

export const TabletSidePanel = ({ isOpen, selectedDate, onClose }: TabletSidePanelProps) => {
  const { addTodo, toggleTodo, deleteTodo, getTodosByDate } = useTodoContext();
  const { categories } = useCategoryContext();
  const panelRef = useRef<HTMLDivElement>(null);

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
          className="fixed inset-0 bg-black/30 z-40 hidden md:block lg:hidden"
          onClick={handleBackgroundClick}
        />
      )}
      
      {/* 사이드 패널 */}
      <div
        ref={panelRef}
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-white shadow-lg border-l border-gray-100 transform transition-transform duration-300 ease-in-out z-50 hidden md:block lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
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
          <div className="flex-1 flex flex-col space-y-4 p-4">
            <TodoForm onAddTodo={handleAddTodo} categories={categories} disabled={!selectedDate} />
            
            <div className="flex-1 overflow-y-auto scrollbar-visible">
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
            
            {/* 키보드 단축키 힌트 */}
            <div className="text-xs text-gray-400 text-center py-2 border-t border-gray-100">
              <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                ESC
              </kbd>
              <span className="ml-1">키를 눌러 닫기</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};