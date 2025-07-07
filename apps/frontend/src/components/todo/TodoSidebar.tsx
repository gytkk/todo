"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';
import { TodoStats } from './TodoStats';
import { useAppContext } from '@/contexts/AppContext';
import { useMemo, useEffect, useRef } from 'react';

interface TodoSidebarProps {
  isOpen: boolean;
  selectedDate: Date | undefined;
  onClose: () => void;
}

export function TodoSidebar({ isOpen, selectedDate, onClose }: TodoSidebarProps) {
  const { addTodo, toggleTodo, deleteTodo, getTodosByDate, categories } = useAppContext();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
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

  const handleAddTodo = (title: string, categoryId: string) => {
    if (selectedDate) {
      addTodo(title, selectedDate, categoryId);
    }
  };

  // ESC 키를 눌렀을 때 사이드바 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    // 사이드바가 열려있을 때만 이벤트 리스너 추가
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey, true);
    }

    // 클린업 함수
    return () => {
      document.removeEventListener('keydown', handleEscapeKey, true);
    };
  }, [isOpen, onClose]);

  // 사이드바가 열릴 때 포커스 설정 및 포커스 트랩
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    const focusableSelector = 'button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    // 첫 번째 포커스 가능한 요소에 포커스
    const focusableElements = sidebar.querySelectorAll(focusableSelector);
    const firstElement = focusableElements[0] as HTMLElement;
    
    if (firstElement) {
      firstElement.focus();
    }

    // Tab 키 포커스 트랩
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const currentFocusableElements = sidebar.querySelectorAll(focusableSelector);
      const firstFocusable = currentFocusableElements[0] as HTMLElement;
      const lastFocusable = currentFocusableElements[currentFocusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: 역방향
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: 정방향
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    sidebar.addEventListener('keydown', handleTabKey);

    return () => {
      sidebar.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-96 bg-white shadow-lg border-l border-gray-100 transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="할일 관리 사이드바"
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">
            {selectedDate
              ? `${format(selectedDate, "MM월 dd일", { locale: ko })} 할일`
              : "할일 목록"}
            {selectedDateTodos.length > 0 && (
              <Badge className="ml-2">{selectedDateTodos.length}</Badge>
            )}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            title="닫기 (ESC)"
            aria-label="사이드바 닫기 (ESC 키)"
          >
            ✕
          </Button>
        </div>
        
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
  );
}