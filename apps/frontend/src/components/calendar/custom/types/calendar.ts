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
  onNavigate: (date: Date) => void;
  view?: CalendarView;
}

export interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onNavigate: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
}

export interface CalendarGridProps {
  currentDate: Date;
  selectedDate?: Date;
  todos: TodoItem[];
  onDateSelect: (date: Date) => void;
  view: CalendarView;
}

export interface CalendarCellProps {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  todos: TodoItem[];
  onSelect: (date: Date) => void;
}

export interface CalendarTodosProps {
  todos: TodoItem[];
  date: Date;
  compact?: boolean;
}