import React from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryManagement } from '../../components/settings/CategoryManagement';
import { TodoItem, TodoCategory } from '@calendar-todo/shared-types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window methods
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(() => true),
});

Object.defineProperty(window, 'alert', {
  writable: true,
  value: jest.fn(),
});

// Mock the hooks
jest.mock('../../hooks/useCategories');
jest.mock('../../contexts/AppContext', () => ({
  useCategoryContext: () => ({
    refreshCategories: jest.fn(),
  }),
}));

import { useCategories } from '../../hooks/useCategories';

const mockedUseCategories = useCategories as jest.MockedFunction<typeof useCategories>;

// Mock data
const mockCategories: TodoCategory[] = [
  {
    id: 'work',
    name: '업무',
    color: '#3b82f6',
    createdAt: new Date('2024-01-01'),
    order: 0,
  },
  {
    id: 'personal',
    name: '개인',
    color: '#ef4444',
    createdAt: new Date('2024-01-01'),
    order: 1,
  },
];


const mockUseCategoriesReturn = {
  categories: mockCategories,
  categoryFilter: { work: true, personal: true },
  loading: false,
  setCategoryFilter: jest.fn(),
  toggleCategoryFilter: jest.fn(),
  getFilteredTodos: jest.fn((todos: TodoItem[]) => todos),
  addCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  getCategoryById: jest.fn(),
  getAvailableColors: jest.fn(() => Promise.resolve(['#10b981', '#f59e0b'])),
  reorderCategories: jest.fn(() => Promise.resolve(true)),
  loadCategories: jest.fn(() => Promise.resolve()),
};


describe('Category Color Integration Flow', () => {
  beforeEach(() => {
    mockedUseCategories.mockReturnValue(mockUseCategoriesReturn);
    
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  describe('Category management integration', () => {
    it('should render category management component', () => {
      render(<CategoryManagement />);
      
      expect(screen.getByText('카테고리 관리')).toBeInTheDocument();
      expect(screen.getByText('할 일 카테고리를 관리하고 색상을 설정합니다')).toBeInTheDocument();
    });

    it('should display existing categories with colors', () => {
      render(<CategoryManagement />);
      
      expect(screen.getByText('업무')).toBeInTheDocument();
      expect(screen.getByText('개인')).toBeInTheDocument();
      // No default badge is shown when there are 2 categories
      expect(screen.queryByText('기본')).not.toBeInTheDocument();
    });
  });

  describe('Basic category functionality', () => {
    it('should handle empty categories list', () => {
      mockedUseCategories.mockReturnValue({
        ...mockUseCategoriesReturn,
        categories: [],
        getAvailableColors: jest.fn(() => Promise.resolve(['#3b82f6', '#ef4444', '#10b981'])),
      });
      
      render(<CategoryManagement />);
      
      // Should show the add category form
      expect(screen.getByText('새 카테고리 추가')).toBeInTheDocument();
      expect(screen.getByText('카테고리 추가')).toBeInTheDocument();
    });

    it('should handle many categories efficiently', () => {
      const manyCategories = Array.from({ length: 10 }, (_, i) => ({
        id: `cat-${i}`,
        name: `Category ${i}`,
        color: '#3b82f6',
        order: i,
        createdAt: new Date(),
      }));
      
      mockedUseCategories.mockReturnValue({
        ...mockUseCategoriesReturn,
        categories: manyCategories,
      });
      
      render(<CategoryManagement />);
      
      // Should render without performance issues
      expect(screen.getByText('카테고리 관리')).toBeInTheDocument();
    });
  });
});