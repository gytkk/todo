import { TodoItem } from '@calendar-todo/shared-types';
import { CalendarDate } from '../types/calendar';
import { isToday, isSameDate, isCurrentMonth, getCalendarDates, getWeekDates } from './dateUtils';
import { format } from 'date-fns';

export const getTodosByDate = (todos: TodoItem[], date: Date): TodoItem[] => {
  const dateString = format(date, 'yyyy-MM-dd');
  return todos.filter(todo => {
    const todoDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
    return format(todoDate, 'yyyy-MM-dd') === dateString;
  });
};

export const createCalendarDates = (
  currentDate: Date,
  selectedDate: Date | undefined,
  todos: TodoItem[],
  view: 'month' | 'week' | 'day'
): CalendarDate[] => {
  let dates: Date[] = [];

  switch (view) {
    case 'month':
      dates = getCalendarDates(currentDate.getFullYear(), currentDate.getMonth());
      break;
    case 'week':
      dates = getWeekDates(currentDate);
      break;
    case 'day':
      dates = [currentDate];
      break;
  }

  return dates.map(date => ({
    date,
    isCurrentMonth: isCurrentMonth(date, currentDate),
    isToday: isToday(date),
    isSelected: selectedDate ? isSameDate(date, selectedDate) : false,
    todos: getTodosByDate(todos, date),
  }));
};

export const getTodoCompletionStats = (todos: TodoItem[]): { total: number; completed: number } => {
  const total = todos.length;
  const completed = todos.filter(todo => todo.completed).length;
  return { total, completed };
};

export const hasIncompleteTodos = (todos: TodoItem[]): boolean => {
  return todos.some(todo => !todo.completed);
};

export const getCompletionPercentage = (todos: TodoItem[]): number => {
  if (todos.length === 0) return 0;
  const completed = todos.filter(todo => todo.completed).length;
  return Math.round((completed / todos.length) * 100);
};