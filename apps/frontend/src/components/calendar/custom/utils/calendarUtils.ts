import { TodoItem } from '@calendar-todo/shared-types';
import { calendarUtils, dateUtils } from '@/utils/dateUtils';

interface CalendarDate {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  todos: TodoItem[];
}

/**
 * Creates calendar dates for the month view
 * Optimized with Map lookup for O(n) performance instead of O(n*35)
 */
export function createCalendarDates(
  currentDate: Date,
  selectedDate: Date | undefined,
  todos: TodoItem[]
): CalendarDate[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Pre-group todos by date key for O(1) lookup instead of O(n) filtering
  const todosByDate = new Map<string, TodoItem[]>();
  todos.forEach(todo => {
    // Ensure todo.date is a valid Date object
    const todoDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
    if (isNaN(todoDate.getTime())) {
      console.warn('Invalid date found in todo:', todo);
      return; // Skip invalid dates
    }
    
    const dateKey = `${todoDate.getFullYear()}-${todoDate.getMonth()}-${todoDate.getDate()}`;
    if (!todosByDate.has(dateKey)) {
      todosByDate.set(dateKey, []);
    }
    todosByDate.get(dateKey)!.push(todo);
  });
  
  // Use consolidated dateUtils for calendar date generation
  const calendarDates = calendarUtils.getCalendarDates(year, month);
  
  return calendarDates.map(date => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const dayTodos = todosByDate.get(dateKey) || [];
    
    return {
      date,
      isToday: dateUtils.isToday(date),
      isSelected: selectedDate ? dateUtils.isSameDay(date, selectedDate) : false,
      isCurrentMonth: calendarUtils.isCurrentMonth(date, currentDate),
      todos: dayTodos,
    };
  });
}

// Removed duplicate isSameDay function - using consolidated dateUtils.isSameDay

/**
 * Gets completion statistics for a list of todos
 */
export function getTodoCompletionStats(todos: TodoItem[]): { total: number; completed: number; incomplete: number } {
  const total = todos.length;
  const completed = todos.filter(todo => todo.completed).length;
  const incomplete = total - completed;
  
  return { total, completed, incomplete };
}

/**
 * Checks if there are any incomplete todos
 */
export function hasIncompleteTodos(todos: TodoItem[]): boolean {
  return todos.some(todo => !todo.completed);
}

/**
 * Gets the appropriate color for a todo item based on completion status
 */
export function getCategoryColorWithOpacity(color: string, opacity: number): string {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse hex color to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Gets the primary category color for a list of todos
 */
export function getPrimaryCategoryColor(todos: TodoItem[]): string {
  if (todos.length === 0) return '#3b82f6';
  
  // Find the first incomplete todo
  const incompleteTodo = todos.find(todo => !todo.completed);
  if (incompleteTodo) {
    return incompleteTodo.category.color;
  }
  
  // If all are completed, return the first todo's color
  return todos[0].category.color;
}

/**
 * Gets all unique category colors from todos
 */
export function getUniqueCategoryColors(todos: TodoItem[]): string[] {
  const colors = new Set<string>();
  todos.forEach(todo => {
    if (!todo.completed) { // Only consider incomplete todos for mixed indicators
      colors.add(todo.category.color);
    }
  });
  return Array.from(colors);
}

/**
 * Determines if we should show a mixed category indicator
 */
export function shouldShowMixedCategoryIndicator(todos: TodoItem[]): boolean {
  const uniqueColors = getUniqueCategoryColors(todos);
  return uniqueColors.length > 1;
}

/**
 * Creates calendar dates for the week view (7 days only)
 * Optimized with Map lookup for better performance
 */
export function createWeekCalendarDates(
  currentDate: Date,
  selectedDate: Date | undefined,
  todos: TodoItem[]
): CalendarDate[] {
  // Pre-group todos by date key for O(1) lookup
  const todosByDate = new Map<string, TodoItem[]>();
  todos.forEach(todo => {
    // Ensure todo.date is a valid Date object
    const todoDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
    if (isNaN(todoDate.getTime())) {
      console.warn('Invalid date found in todo:', todo);
      return; // Skip invalid dates
    }
    
    const dateKey = `${todoDate.getFullYear()}-${todoDate.getMonth()}-${todoDate.getDate()}`;
    if (!todosByDate.has(dateKey)) {
      todosByDate.set(dateKey, []);
    }
    todosByDate.get(dateKey)!.push(todo);
  });
  
  // Use consolidated dateUtils for week date generation
  const weekDates = calendarUtils.getWeekDates(currentDate);
  
  return weekDates.map(date => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const dayTodos = todosByDate.get(dateKey) || [];
    
    return {
      date,
      isToday: dateUtils.isToday(date),
      isSelected: selectedDate ? dateUtils.isSameDay(date, selectedDate) : false,
      isCurrentMonth: calendarUtils.isCurrentMonth(date, currentDate),
      todos: dayTodos,
    };
  });
}

/**
 * Creates calendar data for the day view (single day only)
 * Optimized with Map lookup for better performance
 */
export function createDayCalendarDate(
  currentDate: Date,
  selectedDate: Date | undefined,
  todos: TodoItem[]
): CalendarDate {
  // Pre-group todos by date key for O(1) lookup
  const todosByDate = new Map<string, TodoItem[]>();
  todos.forEach(todo => {
    // Ensure todo.date is a valid Date object
    const todoDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
    if (isNaN(todoDate.getTime())) {
      console.warn('Invalid date found in todo:', todo);
      return; // Skip invalid dates
    }
    
    const dateKey = `${todoDate.getFullYear()}-${todoDate.getMonth()}-${todoDate.getDate()}`;
    if (!todosByDate.has(dateKey)) {
      todosByDate.set(dateKey, []);
    }
    todosByDate.get(dateKey)!.push(todo);
  });
  
  const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
  const dayTodos = todosByDate.get(dateKey) || [];
  
  return {
    date: currentDate,
    isToday: dateUtils.isToday(currentDate),
    isSelected: selectedDate ? dateUtils.isSameDay(currentDate, selectedDate) : false,
    isCurrentMonth: true,
    todos: dayTodos,
  };
}

/**
 * Gets appropriate text color based on background color for readability
 */
export function getContrastTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse hex color
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
}

/**
 * Generates a mixed color indicator for multiple categories
 */
export function getMixedCategoryIndicatorStyle(): React.CSSProperties {
  return {
    background: 'linear-gradient(45deg, #fbbf24 25%, transparent 25%, transparent 75%, #fbbf24 75%)',
    backgroundSize: '4px 4px',
  };
}

/**
 * Extracts unique dates from a list of todos
 */
export function getUniqueDatesFromTodos(todos: TodoItem[]): Date[] {
  const dateSet = new Set<string>();
  const dates: Date[] = [];
  
  todos.forEach(todo => {
    // Ensure todo.date is a valid Date object
    const todoDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
    if (isNaN(todoDate.getTime())) {
      console.warn('Invalid date found in todo:', todo);
      return; // Skip invalid dates
    }
    
    const dateKey = `${todoDate.getFullYear()}-${todoDate.getMonth()}-${todoDate.getDate()}`;
    if (!dateSet.has(dateKey)) {
      dateSet.add(dateKey);
      dates.push(new Date(todoDate));
    }
  });
  
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Groups todos by their date
 */
export function groupTodosByDate(todos: TodoItem[]): Map<string, TodoItem[]> {
  const grouped = new Map<string, TodoItem[]>();
  
  todos.forEach(todo => {
    // Ensure todo.date is a valid Date object
    const todoDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
    if (isNaN(todoDate.getTime())) {
      console.warn('Invalid date found in todo:', todo);
      return; // Skip invalid dates
    }
    
    const dateKey = `${todoDate.getFullYear()}-${todoDate.getMonth()}-${todoDate.getDate()}`;
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(todo);
  });
  
  return grouped;
}

/**
 * Checks if a date has any todos
 */
export function hasTodosOnDate(date: Date, todos: TodoItem[]): boolean {
  return todos.some(todo => {
    const todoDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
    if (isNaN(todoDate.getTime())) {
      return false; // Invalid dates don't match
    }
    return dateUtils.isSameDay(todoDate, date);
  });
}

/**
 * Gets todos for a specific date
 */
export function getTodosForDate(date: Date, todos: TodoItem[]): TodoItem[] {
  return todos.filter(todo => {
    const todoDate = todo.date instanceof Date ? todo.date : new Date(todo.date);
    if (isNaN(todoDate.getTime())) {
      return false; // Invalid dates don't match
    }
    return dateUtils.isSameDay(todoDate, date);
  });
}