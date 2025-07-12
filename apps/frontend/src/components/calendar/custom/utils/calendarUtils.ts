import { TodoItem } from '@calendar-todo/shared-types';

interface CalendarDate {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  todos: TodoItem[];
}

/**
 * Creates calendar dates for the month view
 */
export function createCalendarDates(
  currentDate: Date,
  selectedDate: Date | undefined,
  todos: TodoItem[]
): CalendarDate[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  
  // Get first day of month and last day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the day of week for first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDay.getDay();
  
  // Get days from previous month to fill the first week
  const daysFromPrevMonth = firstDayOfWeek;
  const prevMonthLastDay = new Date(year, month, 0);
  
  // Get days from next month to fill the last week
  const totalCells = Math.ceil((lastDay.getDate() + daysFromPrevMonth) / 7) * 7;
  const daysFromNextMonth = totalCells - (lastDay.getDate() + daysFromPrevMonth);
  
  const calendarDates: CalendarDate[] = [];
  
  // Add days from previous month
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const date = new Date(prevMonthLastDay.getFullYear(), prevMonthLastDay.getMonth(), prevMonthLastDay.getDate() - i);
    const dayTodos = todos.filter(todo => 
      todo.date.getFullYear() === date.getFullYear() &&
      todo.date.getMonth() === date.getMonth() &&
      todo.date.getDate() === date.getDate()
    );
    
    calendarDates.push({
      date,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      isCurrentMonth: false,
      todos: dayTodos,
    });
  }
  
  // Add days from current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dayTodos = todos.filter(todo => 
      todo.date.getFullYear() === date.getFullYear() &&
      todo.date.getMonth() === date.getMonth() &&
      todo.date.getDate() === date.getDate()
    );
    
    calendarDates.push({
      date,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      isCurrentMonth: true,
      todos: dayTodos,
    });
  }
  
  // Add days from next month
  for (let day = 1; day <= daysFromNextMonth; day++) {
    const date = new Date(year, month + 1, day);
    const dayTodos = todos.filter(todo => 
      todo.date.getFullYear() === date.getFullYear() &&
      todo.date.getMonth() === date.getMonth() &&
      todo.date.getDate() === date.getDate()
    );
    
    calendarDates.push({
      date,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      isCurrentMonth: false,
      todos: dayTodos,
    });
  }
  
  return calendarDates;
}

/**
 * Checks if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

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
 * Checks if there are any incomplete todos in the list
 */
export function hasIncompleteTodos(todos: TodoItem[]): boolean {
  return todos.some(todo => !todo.completed);
}

/**
 * Converts hex color to rgba with specified opacity
 */
export function getCategoryColorWithOpacity(hexColor: string, opacity: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse hex color
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Gets the primary category color for a day's todos
 * Prioritizes incomplete todos and returns the first one's color
 */
export function getPrimaryCategoryColor(todos: TodoItem[]): string {
  if (todos.length === 0) return '#3b82f6'; // Default blue
  
  // Find first incomplete todo
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
 */
export function createWeekCalendarDates(
  currentDate: Date,
  selectedDate: Date | undefined,
  todos: TodoItem[]
): CalendarDate[] {
  const today = new Date();
  
  // Get the start of the week (Sunday)
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  
  const calendarDates: CalendarDate[] = [];
  
  // Generate 7 days starting from Sunday
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    
    const dayTodos = todos.filter(todo => 
      todo.date.getFullYear() === date.getFullYear() &&
      todo.date.getMonth() === date.getMonth() &&
      todo.date.getDate() === date.getDate()
    );
    
    calendarDates.push({
      date,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      todos: dayTodos,
    });
  }
  
  return calendarDates;
}

/**
 * Creates calendar data for the day view (single day only)
 */
export function createDayCalendarDate(
  currentDate: Date,
  selectedDate: Date | undefined,
  todos: TodoItem[]
): CalendarDate {
  const today = new Date();
  
  const dayTodos = todos.filter(todo => 
    todo.date.getFullYear() === currentDate.getFullYear() &&
    todo.date.getMonth() === currentDate.getMonth() &&
    todo.date.getDate() === currentDate.getDate()
  );
  
  return {
    date: currentDate,
    isToday: isSameDay(currentDate, today),
    isSelected: selectedDate ? isSameDay(currentDate, selectedDate) : false,
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
 * Gets CSS classes for calendar cell based on its state
 */
export function getCalendarCellClasses(
  isSelected: boolean,
  isToday: boolean,
  isCurrentMonth: boolean
): string {
  if (isSelected) {
    return 'bg-blue-100 hover:bg-blue-200 ring-2 ring-blue-500 ring-inset';
  }
  
  if (isToday) {
    return 'bg-white hover:bg-gray-50';
  }
  
  if (isCurrentMonth) {
    return 'bg-white hover:bg-gray-50';
  }
  
  return 'bg-gray-50 hover:bg-gray-100';
}

/**
 * Gets CSS classes for date number display based on its state
 */
export function getDateNumberClasses(isToday: boolean, isCurrentMonth: boolean): string {
  if (isToday) {
    return 'w-7 h-7 bg-blue-500 text-white rounded-full font-semibold leading-none shadow-md ring-2 ring-blue-200';
  }
  
  if (isCurrentMonth) {
    return 'text-gray-900';
  }
  
  return 'text-gray-400';
}