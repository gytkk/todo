import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useTodoContext, useCategoryContext } from '@/contexts/AppContext';
import { TodoType } from '@calendar-todo/shared-types';

interface UseTodoPanelOptions {
  selectedDate: Date | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export const useTodoPanel = ({ selectedDate, isOpen, onClose }: UseTodoPanelOptions) => {
  const { addTodo, toggleTodo, deleteTodo, getTodosByDate } = useTodoContext();
  const { categories } = useCategoryContext();
  const panelRef = useRef<HTMLDivElement>(null);

  // 선택된 날짜의 할일 목록 계산
  const selectedDateTodos = useMemo(() => {
    return selectedDate ? getTodosByDate(selectedDate) : [];
  }, [selectedDate, getTodosByDate]);

  // 통계 계산
  const stats = useMemo(() => {
    const eventTodos = selectedDateTodos.filter(t => t.todoType === 'event');
    const taskTodos = selectedDateTodos.filter(t => t.todoType === 'task');
    
    return {
      total: selectedDateTodos.length,
      completed: selectedDateTodos.filter(t => t.completed).length,
      incomplete: selectedDateTodos.filter(t => !t.completed).length,
      completionRate: 0,
      recentCompletions: 0,
      byType: {
        event: {
          total: eventTodos.length,
          completed: eventTodos.filter(t => t.completed).length,
          incomplete: eventTodos.filter(t => !t.completed).length,
        },
        task: {
          total: taskTodos.length,
          completed: taskTodos.filter(t => t.completed).length,
          incomplete: taskTodos.filter(t => !t.completed).length,
        },
      },
    };
  }, [selectedDateTodos]);

  // 할일 추가 핸들러
  const handleAddTodo = useCallback((title: string, categoryId: string, todoType: TodoType) => {
    if (selectedDate) {
      addTodo(title, selectedDate, categoryId, todoType);
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

  return {
    // 데이터
    selectedDateTodos,
    stats,
    categories,
    
    // 핸들러
    handleAddTodo,
    toggleTodo,
    deleteTodo,
    
    // Refs
    panelRef,
  };
};