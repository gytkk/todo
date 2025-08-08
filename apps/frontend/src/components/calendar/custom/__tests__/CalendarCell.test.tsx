import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarCell } from '../CalendarCell';
import { TodoItem, TodoCategory } from '@calendar-todo/shared-types';

// Mock the CalendarTodos component
jest.mock('../CalendarTodos', () => ({
  CalendarTodos: ({ todos, compact }: { todos: TodoItem[], compact: boolean }) => (
    <div data-testid="calendar-todos" data-compact={compact}>
      {todos.map(todo => (
        <div key={todo.id} data-testid={`todo-${todo.id}`}>
          {todo.title}
        </div>
      ))}
    </div>
  ),
}));

// Mock the calendarUtils module
jest.mock('../utils/calendarUtils', () => ({
  getTodoCompletionStats: jest.fn(),
  hasIncompleteTodos: jest.fn(),
  getPrimaryCategoryColor: jest.fn(),
  shouldShowMixedCategoryIndicator: jest.fn(),
}));

import { 
  getTodoCompletionStats, 
  hasIncompleteTodos, 
  getPrimaryCategoryColor, 
  shouldShowMixedCategoryIndicator 
} from '../utils/calendarUtils';

const mockedGetTodoCompletionStats = getTodoCompletionStats as jest.MockedFunction<typeof getTodoCompletionStats>;
const mockedHasIncompleteTodos = hasIncompleteTodos as jest.MockedFunction<typeof hasIncompleteTodos>;
const mockedGetPrimaryCategoryColor = getPrimaryCategoryColor as jest.MockedFunction<typeof getPrimaryCategoryColor>;
const mockedShouldShowMixedCategoryIndicator = shouldShowMixedCategoryIndicator as jest.MockedFunction<typeof shouldShowMixedCategoryIndicator>;

// Mock data
const mockCategory1: TodoCategory = {
  id: 'work',
  name: '업무',
  color: '#3b82f6',
  order: 0,
  createdAt: new Date('2024-01-01'),
};

const mockCategory2: TodoCategory = {
  id: 'personal',
  name: '개인',
  color: '#ef4444',
  order: 1,
  createdAt: new Date('2024-01-01'),
};

const mockTodos: TodoItem[] = [
  {
    id: '1',
    title: 'Work meeting',
    date: new Date('2024-01-15'),
    completed: false,
    category: mockCategory1,
    todoType: 'event',
  },
  {
    id: '2',
    title: 'Doctor appointment',
    date: new Date('2024-01-15'),
    completed: false,
    category: mockCategory2,
    todoType: 'task',
  },
];

const defaultProps = {
  date: new Date('2024-01-15'),
  isToday: false,
  isSelected: false,
  isCurrentMonth: true,
  todos: [],
  onSelect: jest.fn(),
};

describe('CalendarCell', () => {
  beforeEach(() => {
    // Reset mocks
    mockedGetTodoCompletionStats.mockReturnValue({
      total: 2,
      completed: 0,
      incomplete: 2,
    });
    mockedHasIncompleteTodos.mockReturnValue(true);
    mockedGetPrimaryCategoryColor.mockReturnValue('#3b82f6');
    mockedShouldShowMixedCategoryIndicator.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render date number correctly', () => {
      render(<CalendarCell {...defaultProps} />);
      
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should apply current month styles', () => {
      render(<CalendarCell {...defaultProps} isCurrentMonth={true} />);
      
      const dateElement = screen.getByText('15');
      expect(dateElement).toHaveClass('text-gray-900');
    });

    it('should apply non-current month styles', () => {
      render(<CalendarCell {...defaultProps} isCurrentMonth={false} />);
      
      const dateElement = screen.getByText('15');
      expect(dateElement).toHaveClass('text-gray-400');
    });
  });

  describe('today highlighting', () => {
    it('should apply today styles when isToday is true', () => {
      render(<CalendarCell {...defaultProps} isToday={true} />);
      
      const dateElement = screen.getByText('15');
      expect(dateElement).toHaveClass('text-gray-900', 'font-semibold');
    });

    it('should not apply today styles when isToday is false', () => {
      render(<CalendarCell {...defaultProps} isToday={false} />);
      
      const dateElement = screen.getByText('15');
      expect(dateElement).not.toHaveClass('bg-blue-500', 'text-white', 'rounded-full');
      expect(dateElement).toHaveClass('text-gray-900'); // Regular current month styling
    });
  });

  describe('selection highlighting', () => {
    it('should apply selected styles when isSelected is true', () => {
      const { container } = render(<CalendarCell {...defaultProps} isSelected={true} />);
      
      const cellElement = container.firstChild as HTMLElement;
      expect(cellElement).toHaveClass('ring-2', 'ring-blue-500', 'ring-inset');
    });

    it('should not apply selected styles when isSelected is false', () => {
      const { container } = render(<CalendarCell {...defaultProps} isSelected={false} />);
      
      const cellElement = container.firstChild as HTMLElement;
      expect(cellElement).not.toHaveClass('ring-2', 'ring-blue-500', 'ring-inset');
    });
  });

  describe('todo indicators', () => {
    it('should show completion stats when todos exist', () => {
      render(<CalendarCell {...defaultProps} todos={mockTodos} />);
      
      expect(screen.getByText('0/2')).toBeInTheDocument();
    });

    it('should show category color indicator for incomplete todos', () => {
      render(<CalendarCell {...defaultProps} todos={mockTodos} />);
      
      // Find the indicator dot
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2') && el.className.includes('h-2') && el.className.includes('rounded-full')
      );
      
      expect(indicators.length).toBeGreaterThan(0);
      expect(mockedGetPrimaryCategoryColor).toHaveBeenCalledWith(mockTodos);
    });

    it('should show primary category indicator when todos exist', () => {
      mockedHasIncompleteTodos.mockReturnValue(true);
      mockedGetPrimaryCategoryColor.mockReturnValue('#3b82f6');
      
      render(<CalendarCell {...defaultProps} todos={mockTodos} />);
      
      // Look for the primary category indicator
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2') && el.className.includes('h-2') && el.className.includes('rounded-full')
      );
      
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('should not show indicator when no incomplete todos', () => {
      mockedHasIncompleteTodos.mockReturnValue(false);
      
      render(<CalendarCell {...defaultProps} todos={mockTodos} />);
      
      // Should not find category color indicators
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2') && el.className.includes('h-2') && el.className.includes('rounded-full')
      );
      
      expect(indicators).toHaveLength(0);
    });

    it('should not show any indicators when no todos exist', () => {
      mockedGetTodoCompletionStats.mockReturnValue({
        total: 0,
        completed: 0,
        incomplete: 0,
      });
      
      render(<CalendarCell {...defaultProps} todos={[]} />);
      
      expect(screen.queryByText(/\/\d+/)).not.toBeInTheDocument();
    });
  });

  describe('CalendarTodos integration', () => {
    it('should render CalendarTodos component with correct props', () => {
      render(<CalendarCell {...defaultProps} todos={mockTodos} />);
      
      const calendarTodos = screen.getByTestId('calendar-todos');
      expect(calendarTodos).toBeInTheDocument();
      expect(calendarTodos).toHaveAttribute('data-compact', 'true');
      
      // Should render todo items
      expect(screen.getByTestId('todo-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-2')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onSelect when cell is clicked', () => {
      const mockOnSelect = jest.fn();
      render(<CalendarCell {...defaultProps} onSelect={mockOnSelect} />);
      
      const cellElement = screen.getByRole('button');
      fireEvent.click(cellElement);
      
      expect(mockOnSelect).toHaveBeenCalledWith(defaultProps.date);
    });

    it('should call onSelect when Enter key is pressed', () => {
      const mockOnSelect = jest.fn();
      render(<CalendarCell {...defaultProps} onSelect={mockOnSelect} />);
      
      const cellElement = screen.getByRole('button');
      fireEvent.keyDown(cellElement, { key: 'Enter' });
      
      expect(mockOnSelect).toHaveBeenCalledWith(defaultProps.date);
    });

    it('should call onSelect when Space key is pressed', () => {
      const mockOnSelect = jest.fn();
      render(<CalendarCell {...defaultProps} onSelect={mockOnSelect} />);
      
      const cellElement = screen.getByRole('button');
      fireEvent.keyDown(cellElement, { key: ' ' });
      
      expect(mockOnSelect).toHaveBeenCalledWith(defaultProps.date);
    });

    it('should not call onSelect for other keys', () => {
      const mockOnSelect = jest.fn();
      render(<CalendarCell {...defaultProps} onSelect={mockOnSelect} />);
      
      const cellElement = screen.getByRole('button');
      fireEvent.keyDown(cellElement, { key: 'Escape' });
      
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<CalendarCell {...defaultProps} todos={mockTodos} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveAttribute('aria-label', '15일, 2개 할일');
    });

    it('should have proper ARIA label without todos', () => {
      render(<CalendarCell {...defaultProps} todos={[]} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveAttribute('aria-label', '15일');
    });

    it('should be focusable with tabIndex', () => {
      render(<CalendarCell {...defaultProps} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveAttribute('tabIndex', '0');
    });

    it('should have button role', () => {
      render(<CalendarCell {...defaultProps} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toBeInTheDocument();
    });
  });

  describe('hover effects', () => {
    it('should apply hover classes for current month cells', () => {
      const { container } = render(<CalendarCell {...defaultProps} isCurrentMonth={true} />);
      
      const cellElement = container.firstChild as HTMLElement;
      expect(cellElement).toHaveClass('hover:bg-gray-50');
    });

    it('should apply different hover classes for non-current month cells', () => {
      const { container } = render(<CalendarCell {...defaultProps} isCurrentMonth={false} />);
      
      const cellElement = container.firstChild as HTMLElement;
      expect(cellElement).toHaveClass('hover:bg-gray-100');
    });

    it('should apply special hover for today', () => {
      const { container } = render(<CalendarCell {...defaultProps} isToday={true} />);
      
      const cellElement = container.firstChild as HTMLElement;
      expect(cellElement).toHaveClass('hover:bg-blue-100');
    });
  });

  describe('edge cases', () => {
    it('should handle date with single digit correctly', () => {
      const singleDigitDate = new Date('2024-01-05');
      render(<CalendarCell {...defaultProps} date={singleDigitDate} />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle end of month dates', () => {
      const endOfMonthDate = new Date('2024-01-31');
      render(<CalendarCell {...defaultProps} date={endOfMonthDate} />);
      
      expect(screen.getByText('31')).toBeInTheDocument();
    });

    it('should handle large number of todos gracefully', () => {
      const manyTodos = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Todo ${i + 1}`,
        date: new Date(),
        completed: false,
        category: mockCategory1,
        todoType: 'task' as const,
      }));
      
      mockedGetTodoCompletionStats.mockReturnValue({
        total: 50,
        completed: 0,
        incomplete: 50,
      });
      
      render(<CalendarCell {...defaultProps} todos={manyTodos} />);
      
      expect(screen.getByText('0/50')).toBeInTheDocument();
    });
  });
});