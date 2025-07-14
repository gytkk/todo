"use client";

import { useCallback } from 'react';
import { Button, Badge } from "@calendar-todo/ui";
import { TodoForm } from '@/components/todo/TodoForm';
import { TodoList } from '@/components/todo/TodoList';
import { TodoStats } from '@/components/todo/TodoStats';
import { useTodoPanel } from '@/hooks/useTodoPanel';
import { formatDate } from '@/utils/dateUtils';

interface MobileBottomSheetProps {
  isOpen: boolean;
  selectedDate: Date | undefined;
  onClose: () => void;
}

export const MobileBottomSheet = ({ isOpen, selectedDate, onClose }: MobileBottomSheetProps) => {
  const {
    selectedDateTodos,
    stats,
    categories,
    handleAddTodo,
    toggleTodo,
    deleteTodo,
    panelRef,
  } = useTodoPanel({ selectedDate, isOpen, onClose });

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
        ref={panelRef}
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
                ? `${formatDate.monthDay(selectedDate)} 할일`
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