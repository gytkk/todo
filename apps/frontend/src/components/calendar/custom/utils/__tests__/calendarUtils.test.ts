import { TodoItem, TodoCategory } from '@calendar-todo/shared-types';
import {
  getCategoryColorWithOpacity,
  getPrimaryCategoryColor,
  getUniqueCategoryColors,
  shouldShowMixedCategoryIndicator,
  getContrastTextColor,
  getMixedCategoryIndicatorStyle,
  getTodoCompletionStats,
  hasIncompleteTodos,
  createCalendarDates,
} from '../calendarUtils';

// Mock data
const mockCategory1: TodoCategory = {
  id: 'work',
  name: '업무',
  color: '#3b82f6',
  createdAt: new Date('2024-01-01'),
};

const mockCategory2: TodoCategory = {
  id: 'personal',
  name: '개인',
  color: '#ef4444',
  createdAt: new Date('2024-01-01'),
};

const mockTodo1: TodoItem = {
  id: '1',
  title: 'Work todo',
  date: new Date('2024-01-15'),
  completed: false,
  category: mockCategory1,
};

const mockTodo2: TodoItem = {
  id: '2',
  title: 'Personal todo',
  date: new Date('2024-01-15'),
  completed: false,
  category: mockCategory2,
};

const mockTodo3: TodoItem = {
  id: '3',
  title: 'Completed todo',
  date: new Date('2024-01-15'),
  completed: true,
  category: mockCategory1,
};

describe('calendarUtils', () => {
  describe('getCategoryColorWithOpacity', () => {
    it('should convert hex color to rgba with specified opacity', () => {
      const result = getCategoryColorWithOpacity('#3b82f6', 0.5);
      expect(result).toBe('rgba(59, 130, 246, 0.5)');
    });

    it('should handle hex color without # prefix', () => {
      const result = getCategoryColorWithOpacity('3b82f6', 0.3);
      expect(result).toBe('rgba(59, 130, 246, 0.3)');
    });

    it('should handle different opacity values', () => {
      const result1 = getCategoryColorWithOpacity('#ff0000', 0);
      const result2 = getCategoryColorWithOpacity('#ff0000', 1);
      
      expect(result1).toBe('rgba(255, 0, 0, 0)');
      expect(result2).toBe('rgba(255, 0, 0, 1)');
    });
  });

  describe('getPrimaryCategoryColor', () => {
    it('should return default blue for empty todos array', () => {
      const result = getPrimaryCategoryColor([]);
      expect(result).toBe('#3b82f6');
    });

    it('should return first incomplete todo color', () => {
      const todos = [mockTodo3, mockTodo1, mockTodo2]; // completed first
      const result = getPrimaryCategoryColor(todos);
      expect(result).toBe(mockCategory1.color);
    });

    it('should return first todo color when all are completed', () => {
      const completedTodos = [
        { ...mockTodo1, completed: true },
        { ...mockTodo2, completed: true },
      ];
      const result = getPrimaryCategoryColor(completedTodos);
      expect(result).toBe(mockCategory1.color);
    });
  });

  describe('getUniqueCategoryColors', () => {
    it('should return empty array for empty todos', () => {
      const result = getUniqueCategoryColors([]);
      expect(result).toEqual([]);
    });

    it('should return unique colors only from incomplete todos', () => {
      const todos = [mockTodo1, mockTodo2, mockTodo3]; // mockTodo3 is completed
      const result = getUniqueCategoryColors(todos);
      expect(result).toEqual([mockCategory1.color, mockCategory2.color]);
    });

    it('should handle duplicate colors', () => {
      const todos = [
        mockTodo1,
        { ...mockTodo1, id: '4' }, // same category as mockTodo1
      ];
      const result = getUniqueCategoryColors(todos);
      expect(result).toEqual([mockCategory1.color]);
    });
  });

  describe('shouldShowMixedCategoryIndicator', () => {
    it('should return false for empty todos', () => {
      const result = shouldShowMixedCategoryIndicator([]);
      expect(result).toBe(false);
    });

    it('should return false for single category', () => {
      const todos = [mockTodo1, { ...mockTodo1, id: '4' }];
      const result = shouldShowMixedCategoryIndicator(todos);
      expect(result).toBe(false);
    });

    it('should return true for multiple categories', () => {
      const todos = [mockTodo1, mockTodo2];
      const result = shouldShowMixedCategoryIndicator(todos);
      expect(result).toBe(true);
    });

    it('should ignore completed todos when checking for mixed categories', () => {
      const todos = [mockTodo1, mockTodo3]; // mockTodo3 is completed with same category as mockTodo1
      const result = shouldShowMixedCategoryIndicator(todos);
      expect(result).toBe(false);
    });
  });

  describe('getContrastTextColor', () => {
    it('should return dark text for light backgrounds', () => {
      const result = getContrastTextColor('#ffffff'); // white
      expect(result).toBe('#1f2937');
    });

    it('should return light text for dark backgrounds', () => {
      const result = getContrastTextColor('#000000'); // black
      expect(result).toBe('#ffffff');
    });

    it('should handle hex colors without # prefix', () => {
      const result = getContrastTextColor('ffffff');
      expect(result).toBe('#1f2937');
    });
  });

  describe('getMixedCategoryIndicatorStyle', () => {
    it('should return gradient style object', () => {
      const result = getMixedCategoryIndicatorStyle();
      expect(result).toEqual({
        background: 'linear-gradient(45deg, #fbbf24 25%, transparent 25%, transparent 75%, #fbbf24 75%)',
        backgroundSize: '4px 4px',
      });
    });
  });

  describe('getTodoCompletionStats', () => {
    it('should return correct stats for empty array', () => {
      const result = getTodoCompletionStats([]);
      expect(result).toEqual({
        total: 0,
        completed: 0,
        incomplete: 0,
      });
    });

    it('should return correct stats for mixed todos', () => {
      const todos = [mockTodo1, mockTodo2, mockTodo3]; // 2 incomplete, 1 completed
      const result = getTodoCompletionStats(todos);
      expect(result).toEqual({
        total: 3,
        completed: 1,
        incomplete: 2,
      });
    });
  });

  describe('hasIncompleteTodos', () => {
    it('should return false for empty array', () => {
      const result = hasIncompleteTodos([]);
      expect(result).toBe(false);
    });

    it('should return false when all todos are completed', () => {
      const completedTodos = [
        { ...mockTodo1, completed: true },
        { ...mockTodo2, completed: true },
      ];
      const result = hasIncompleteTodos(completedTodos);
      expect(result).toBe(false);
    });

    it('should return true when there are incomplete todos', () => {
      const todos = [mockTodo1, mockTodo3]; // mockTodo1 is incomplete
      const result = hasIncompleteTodos(todos);
      expect(result).toBe(true);
    });
  });

  describe('createCalendarDates', () => {
    const currentDate = new Date('2024-01-15'); // Monday in middle of month
    const selectedDate = new Date('2024-01-20');
    const todos = [
      { ...mockTodo1, date: new Date('2024-01-15') },
      { ...mockTodo2, date: new Date('2024-01-20') },
    ];

    it('should create calendar dates for the month', () => {
      const result = createCalendarDates(currentDate, selectedDate, todos);
      
      // Should have enough cells to fill calendar grid (typically 35 or 42)
      expect(result.length).toBeGreaterThanOrEqual(35);
      expect(result.length).toBeLessThanOrEqual(42);
    });

    it('should mark selected date correctly', () => {
      const result = createCalendarDates(currentDate, selectedDate, todos);
      const selectedCell = result.find(cell => cell.isSelected);
      
      expect(selectedCell).toBeDefined();
      expect(selectedCell?.date.getDate()).toBe(20);
      expect(selectedCell?.date.getMonth()).toBe(0); // January
    });

    it('should mark today correctly', () => {
      const today = new Date();
      const result = createCalendarDates(today, undefined, []);
      const todayCell = result.find(cell => cell.isToday);
      
      expect(todayCell).toBeDefined();
      expect(todayCell?.date.getDate()).toBe(today.getDate());
    });

    it('should include todos for correct dates', () => {
      const result = createCalendarDates(currentDate, selectedDate, todos);
      
      const jan15Cell = result.find(cell => 
        cell.date.getDate() === 15 && 
        cell.date.getMonth() === 0 && 
        cell.isCurrentMonth
      );
      const jan20Cell = result.find(cell => 
        cell.date.getDate() === 20 && 
        cell.date.getMonth() === 0 && 
        cell.isCurrentMonth
      );
      
      expect(jan15Cell?.todos).toHaveLength(1);
      expect(jan20Cell?.todos).toHaveLength(1);
    });

    it('should mark current month dates correctly', () => {
      const result = createCalendarDates(currentDate, selectedDate, todos);
      
      const currentMonthCells = result.filter(cell => cell.isCurrentMonth);
      const previousMonthCells = result.filter(cell => !cell.isCurrentMonth && cell.date < currentDate);
      const nextMonthCells = result.filter(cell => !cell.isCurrentMonth && cell.date > currentDate);
      
      expect(currentMonthCells.length).toBe(31); // January has 31 days
      expect(previousMonthCells.length).toBeGreaterThan(0);
      expect(nextMonthCells.length).toBeGreaterThan(0);
    });
  });
});