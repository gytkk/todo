import { TodoItem } from '@calendar-todo/shared-types';

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  todos: TodoItem[];
}

export interface CalendarProps {
  currentDate: Date;
  selectedDate?: Date;
  todos: TodoItem[];
  onDateSelect: (date: Date) => void;
  onDateChangeWithoutSidebar?: (date: Date) => void;
  onNavigate: (date: Date) => void;
  view?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  allTodos?: TodoItem[]; // 필터링 전 전체 할일 목록
  hasActiveFilters?: boolean; // 필터가 활성화되어 있는지 여부
}

export interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onNavigate: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onDateSelect: (date: Date) => void;
  onDateChangeWithoutSidebar?: (date: Date) => void;
}

export interface CalendarGridProps {
  currentDate: Date;
  selectedDate?: Date;
  todos: TodoItem[];
  onDateSelect: (date: Date) => void;
  onDateChangeWithoutSidebar?: (date: Date) => void;
  view: CalendarView;
  allTodos?: TodoItem[]; // 필터링 전 전체 할일 목록
  hasActiveFilters?: boolean; // 필터가 활성화되어 있는지 여부
}

export interface CalendarCellProps {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  todos: TodoItem[];
  onSelect: (date: Date) => void;
  allTodos?: TodoItem[]; // 필터링 전 전체 할일 목록
  hasActiveFilters?: boolean; // 필터가 활성화되어 있는지 여부
}

export interface CalendarTodosProps {
  todos: TodoItem[];
  date: Date;
  compact?: boolean;
}
