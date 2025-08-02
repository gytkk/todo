import React from 'react';
import { render, screen } from '@testing-library/react';
import { CalendarTodos } from '../CalendarTodos';
import { TodoItem, TodoCategory } from '@calendar-todo/shared-types';

// Mock the calendarUtils module
jest.mock('../utils/calendarUtils', () => ({
  getTodoCompletionStats: jest.fn(),
  getCategoryColorWithOpacity: jest.fn(),
}));

import { getTodoCompletionStats, getCategoryColorWithOpacity } from '../utils/calendarUtils';

const mockedGetTodoCompletionStats = getTodoCompletionStats as jest.MockedFunction<typeof getTodoCompletionStats>;
const mockedGetCategoryColorWithOpacity = getCategoryColorWithOpacity as jest.MockedFunction<typeof getCategoryColorWithOpacity>;

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
  {
    id: '3',
    title: 'Completed task',
    date: new Date('2024-01-15'),
    completed: true,
    category: mockCategory1,
    todoType: 'task',
  },
];

describe('CalendarTodos', () => {
  beforeEach(() => {
    // Reset mocks
    mockedGetTodoCompletionStats.mockReturnValue({
      total: 3,
      completed: 1,
      incomplete: 2,
    });
    mockedGetCategoryColorWithOpacity.mockReturnValue('rgba(59, 130, 246, 0.15)');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when todos array is empty', () => {
    it('should return null and not render anything', () => {
      const { container } = render(<CalendarTodos todos={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('compact mode', () => {
    it('should render todos in compact format', () => {
      render(<CalendarTodos todos={mockTodos} compact={true} />);
      
      // Should show todo titles
      expect(screen.getByText('Work meeting')).toBeInTheDocument();
      expect(screen.getByText('Doctor appointment')).toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();
    });

    it('should apply category colors to incomplete todos', () => {
      render(<CalendarTodos todos={mockTodos} compact={true} />);
      
      
      // Check that getCategoryColorWithOpacity was called with correct parameters
      expect(mockedGetCategoryColorWithOpacity).toHaveBeenCalledWith(mockCategory1.color, 0.15);
      expect(mockedGetCategoryColorWithOpacity).toHaveBeenCalledWith(mockCategory2.color, 0.15);
    });

    it('should apply gray styles to completed todos', () => {
      render(<CalendarTodos todos={mockTodos} compact={true} />);
      
      const completedTodoContainer = screen.getByText('Completed task').closest('div');
      expect(completedTodoContainer).toHaveClass('bg-gray-100', 'text-gray-500', 'line-through');
    });

    it('should show overflow indicator when there are more than 4 todos', () => {
      const manyTodos = [
        ...mockTodos,
        { id: '4', title: 'Todo 4', date: new Date(), completed: false, category: mockCategory1, todoType: 'task' },
        { id: '5', title: 'Todo 5', date: new Date(), completed: false, category: mockCategory1, todoType: 'event' },
      ];
      
      render(<CalendarTodos todos={manyTodos} compact={true} />);
      
      expect(screen.getByText('+1개 더')).toBeInTheDocument();
    });

    it('should limit display to 4 todos in compact mode', () => {
      const manyTodos = Array.from({ length: 7 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Todo ${i + 1}`,
        date: new Date(),
        completed: false,
        category: mockCategory1,
        todoType: 'task',
      }));
      
      render(<CalendarTodos todos={manyTodos} compact={true} />);
      
      // Should only show 4 todo titles
      expect(screen.getByText('Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Todo 2')).toBeInTheDocument();
      expect(screen.getByText('Todo 3')).toBeInTheDocument();
      expect(screen.getByText('Todo 4')).toBeInTheDocument();
      expect(screen.queryByText('Todo 5')).not.toBeInTheDocument();
      
      // Should show overflow indicator
      expect(screen.getByText('+3개 더')).toBeInTheDocument();
    });
  });

  describe('full mode', () => {
    it('should render todos in full format with bullets', () => {
      render(<CalendarTodos todos={mockTodos} compact={false} />);
      
      // Should show todo titles
      expect(screen.getByText('Work meeting')).toBeInTheDocument();
      expect(screen.getByText('Doctor appointment')).toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();
    });

    it('should apply category colors to incomplete todos with different opacity', () => {
      render(<CalendarTodos todos={mockTodos} compact={false} />);
      
      // Check that getCategoryColorWithOpacity was called with 0.1 opacity for full mode
      expect(mockedGetCategoryColorWithOpacity).toHaveBeenCalledWith(mockCategory1.color, 0.1);
      expect(mockedGetCategoryColorWithOpacity).toHaveBeenCalledWith(mockCategory2.color, 0.1);
    });

    it('should show completion stats when there are multiple todos', () => {
      render(<CalendarTodos todos={mockTodos} compact={false} />);
      
      expect(screen.getByText('1/3 완료')).toBeInTheDocument();
    });

    it('should not show completion stats for single todo', () => {
      const singleTodo = [mockTodos[0]];
      mockedGetTodoCompletionStats.mockReturnValue({
        total: 1,
        completed: 0,
        incomplete: 1,
      });
      
      render(<CalendarTodos todos={singleTodo} compact={false} />);
      
      expect(screen.queryByText('0/1 완료')).not.toBeInTheDocument();
    });

    it('should render bullet points with category colors for incomplete todos', () => {
      render(<CalendarTodos todos={mockTodos} compact={false} />);
      
      // Check for bullet elements (div with w-2 h-2 rounded-full)
      const bullets = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2') && el.className.includes('h-2') && el.className.includes('rounded-full')
      );
      
      expect(bullets.length).toBeGreaterThan(0);
    });

    it('should apply gray bullets to completed todos', () => {
      render(<CalendarTodos todos={mockTodos} compact={false} />);
      
      const completedTodo = screen.getByText('Completed task');
      // Find the parent div that contains the styling classes
      const completedContainer = completedTodo.closest('[class*="bg-gray-100"]');
      expect(completedContainer).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper title attributes for truncated text', () => {
      render(<CalendarTodos todos={mockTodos} compact={true} />);
      
      const workTodoContainer = screen.getByText('Work meeting').closest('div');
      expect(workTodoContainer).toHaveAttribute('title', '📅 이벤트: Work meeting');
    });

    it('should render todos with proper semantic structure', () => {
      render(<CalendarTodos todos={mockTodos} compact={false} />);
      
      // Check that todos are within proper container structure
      const todoElements = screen.getAllByText(/meeting|appointment|task/);
      todoElements.forEach(todo => {
        expect(todo.closest('[class*="space-y"]')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle todos with very long titles', () => {
      const longTitleTodos = [{
        id: '1',
        title: 'This is a very long todo title that should be truncated properly in the UI',
        date: new Date(),
        completed: false,
        category: mockCategory1,
        todoType: 'event',
      }];
      
      render(<CalendarTodos todos={longTitleTodos} compact={true} />);
      
      const todoElement = screen.getByText(longTitleTodos[0].title);
      expect(todoElement).toHaveClass('truncate');
    });

    it('should handle empty todo titles gracefully', () => {
      const emptyTitleTodos = [{
        id: '1',
        title: '',
        date: new Date(),
        completed: false,
        category: mockCategory1,
        todoType: 'task',
      }];
      
      render(<CalendarTodos todos={emptyTitleTodos} compact={true} />);
      
      // Should render even with empty title - check if the element exists
      const todoElements = screen.getAllByRole('generic');
      const emptyTodoElement = todoElements.find(el => el.getAttribute('title') === '📝 작업: ');
      expect(emptyTodoElement).toBeInTheDocument();
    });
  });
});