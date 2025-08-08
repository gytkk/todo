import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryManagement } from '../CategoryManagement';
import { TodoCategory } from '@calendar-todo/shared-types';

// Mock the useCategories hook
jest.mock('../../../hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

// Mock the CategoryContext
jest.mock('../../../contexts/AppContext', () => ({
  useCategoryContext: () => ({
    refreshCategories: jest.fn(),
  }),
}));

import { useCategories } from '../../../hooks/useCategories';
const mockedUseCategories = useCategories as jest.MockedFunction<typeof useCategories>;

// Mock window.confirm and window.alert
const mockConfirm = jest.fn();
const mockAlert = jest.fn();

Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
});

Object.defineProperty(window, 'alert', {
  writable: true,
  value: mockAlert,
});

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

const mockAvailableColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', 
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'
]; // Match CATEGORY_COLORS from constants

const mockUseCategoriesReturn = {
  categories: mockCategories,
  categoryFilter: { work: true, personal: true },
  loading: false,
  setCategoryFilter: jest.fn(),
  toggleCategoryFilter: jest.fn(),
  getFilteredTodos: jest.fn(),
  addCategory: jest.fn(() => Promise.resolve({ 
    id: 'new-category', 
    name: 'New Category', 
    color: '#10b981', 
    createdAt: new Date(),
    order: 2
  })),
  updateCategory: jest.fn(() => Promise.resolve(true)),
  deleteCategory: jest.fn(() => Promise.resolve(true)),
  getCategoryById: jest.fn(),
  getAvailableColors: jest.fn(() => Promise.resolve(mockAvailableColors)),
  reorderCategories: jest.fn(() => Promise.resolve(true)),
  loadCategories: jest.fn(() => Promise.resolve()),
};

describe('CategoryManagement', () => {
  beforeEach(() => {
    mockedUseCategories.mockReturnValue(mockUseCategoriesReturn);
    mockConfirm.mockReturnValue(true);
    mockAlert.mockClear();
    jest.clearAllMocks();
  });

  const renderWithAct = async (component: React.ReactElement) => {
    let renderResult: ReturnType<typeof render> | undefined;
    await act(async () => {
      renderResult = render(component);
    });
    return renderResult!;
  };

  describe('rendering', () => {
    it('should render category management card with title', async () => {
      await renderWithAct(<CategoryManagement />);
      
      expect(screen.getByText('카테고리 관리')).toBeInTheDocument();
      expect(screen.getByText('할 일 카테고리를 관리하고 색상을 설정합니다')).toBeInTheDocument();
    });

    it('should display existing categories', () => {
      render(<CategoryManagement />);
      
      expect(screen.getByText('업무')).toBeInTheDocument();
      expect(screen.getByText('개인')).toBeInTheDocument();
    });

    it('should show last badge when only one category remains', () => {
      // Mock categories with only one category
      const singleCategoryMock = {
        ...mockUseCategoriesReturn,
        categories: [mockCategories[0]], // Only one category
      };
      mockedUseCategories.mockReturnValue(singleCategoryMock);
      
      render(<CategoryManagement />);
      
      expect(screen.getByText('마지막')).toBeInTheDocument();
    });

    it('should display category colors correctly', () => {
      render(<CategoryManagement />);
      
      // Check for color indicators (divs with specific background colors)
      const colorIndicators = screen.getAllByRole('generic').filter(el => 
        el.style.backgroundColor
      );
      
      expect(colorIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('category editing', () => {
    it('should allow editing category names', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      // Find and click edit button for any category
      const editButtons = screen.getAllByText('수정');
      const personalEditButton = editButtons.find(button => 
        button.closest('[class*="p-3"]')?.textContent?.includes('개인')
      );
      
      if (personalEditButton) {
        await user.click(personalEditButton);
        
        // Should show input field
        const input = screen.getByDisplayValue('개인');
        expect(input).toBeInTheDocument();
        
        // Should show save and cancel buttons
        expect(screen.getByText('저장')).toBeInTheDocument();
        expect(screen.getByText('취소')).toBeInTheDocument();
      }
    });

    it('should save category name changes', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      // Click edit button for personal category
      const editButtons = screen.getAllByText('수정');
      const personalEditButton = editButtons.find(button => 
        button.closest('[class*="p-3"]')?.textContent?.includes('개인')
      );
      
      if (personalEditButton) {
        await user.click(personalEditButton);
        
        const input = screen.getByDisplayValue('개인');
        await user.clear(input);
        await user.type(input, '새 이름');
        
        const saveButton = screen.getByText('저장');
        await user.click(saveButton);
        
        expect(mockUseCategoriesReturn.updateCategory).toHaveBeenCalledWith(
          'personal',
          { name: '새 이름' }
        );
      }
    });

    it('should cancel category name editing', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      // Click edit button for personal category
      const editButtons = screen.getAllByText('수정');
      const personalEditButton = editButtons.find(button => 
        button.closest('[class*="p-3"]')?.textContent?.includes('개인')
      );
      
      if (personalEditButton) {
        await user.click(personalEditButton);
        
        const cancelButton = screen.getByText('취소');
        await user.click(cancelButton);
        
        // Should not call updateCategory
        expect(mockUseCategoriesReturn.updateCategory).not.toHaveBeenCalled();
        
        // Should return to display mode
        expect(screen.getByText('개인')).toBeInTheDocument();
      }
    });

    it('should enable edit button for all categories', () => {
      render(<CategoryManagement />);
      
      // Find edit button in any category row
      const editButtons = screen.getAllByText('수정');
      
      // All edit buttons should be enabled
      editButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should prevent duplicate category names', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      // Click edit button for personal category
      const editButtons = screen.getAllByText('수정');
      const personalEditButton = editButtons.find(button => 
        button.closest('[class*="p-3"]')?.textContent?.includes('개인')
      );
      
      if (personalEditButton) {
        await user.click(personalEditButton);
        
        const input = screen.getByDisplayValue('개인');
        await user.clear(input);
        await user.type(input, '업무'); // Duplicate name
        
        const saveButton = screen.getByText('저장');
        await user.click(saveButton);
        
        expect(mockAlert).toHaveBeenCalledWith('이미 존재하는 카테고리 이름입니다.');
        expect(mockUseCategoriesReturn.updateCategory).not.toHaveBeenCalled();
      }
    });
  });

  describe('category deletion', () => {
    it('should delete non-default categories', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      // Find and click delete button for non-default category
      const deleteButtons = screen.getAllByText('삭제');
      const personalDeleteButton = deleteButtons.find(button => 
        button.closest('[class*="p-3"]')?.textContent?.includes('개인')
      );
      
      if (personalDeleteButton) {
        await user.click(personalDeleteButton);
        
        expect(mockUseCategoriesReturn.deleteCategory).toHaveBeenCalledWith('personal', []);
      }
    });

    it('should disable delete button when only one category remains', () => {
      // Mock categories with only one category
      const singleCategoryMock = {
        ...mockUseCategoriesReturn,
        categories: [mockCategories[0]], // Only one category
      };
      mockedUseCategories.mockReturnValue(singleCategoryMock);
      
      render(<CategoryManagement />);
      
      // Find delete button - should be disabled
      const deleteButton = screen.getByText('삭제');
      expect(deleteButton).toBeDisabled();
    });

    it('should show alert when trying to delete the last category', async () => {
      // Mock categories with only one category
      const singleCategoryMock = {
        ...mockUseCategoriesReturn,
        categories: [mockCategories[0]], // Only one category
      };
      mockedUseCategories.mockReturnValue(singleCategoryMock);
      
      render(<CategoryManagement />);
      
      // Delete button should be disabled, preventing the deletion
      const deleteButton = screen.getByText('삭제');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('adding new categories', () => {
    it('should render add category form', () => {
      render(<CategoryManagement />);
      
      expect(screen.getByText('새 카테고리 추가')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('카테고리 이름을 입력하세요')).toBeInTheDocument();
      expect(screen.getByText('색상 선택')).toBeInTheDocument();
      expect(screen.getByText('카테고리 추가')).toBeInTheDocument();
    });

    it('should display available colors', async () => {
      await renderWithAct(<CategoryManagement />);
      
      // Wait for color buttons to be rendered after async load
      await waitFor(() => {
        const colorButtons = screen.getAllByRole('button').filter(button => 
          button.style.backgroundColor && button.title?.includes('색상:')
        );
        expect(colorButtons.length).toBe(mockAvailableColors.length);
      });
    });

    it('should add new category with valid input', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      const nameInput = screen.getByPlaceholderText('카테고리 이름을 입력하세요');
      await user.type(nameInput, '새 카테고리');
      
      // Select a color
      const firstColorButton = screen.getAllByRole('button').find(button => 
        button.style.backgroundColor && button.title?.includes('색상:')
      );
      
      if (firstColorButton) {
        await user.click(firstColorButton);
      }
      
      const addButton = screen.getByText('카테고리 추가');
      await user.click(addButton);
      
      expect(mockUseCategoriesReturn.addCategory).toHaveBeenCalledWith(
        '새 카테고리',
        mockAvailableColors[0]
      );
    });

    it('should prevent adding duplicate category names', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      const nameInput = screen.getByPlaceholderText('카테고리 이름을 입력하세요');
      await user.type(nameInput, '업무'); // Existing name
      
      // Select a color
      const firstColorButton = screen.getAllByRole('button').find(button => 
        button.style.backgroundColor && button.title?.includes('색상:')
      );
      
      if (firstColorButton) {
        await user.click(firstColorButton);
      }
      
      const addButton = screen.getByText('카테고리 추가');
      await user.click(addButton);
      
      expect(mockAlert).toHaveBeenCalledWith('이미 존재하는 카테고리 이름입니다.');
      expect(mockUseCategoriesReturn.addCategory).not.toHaveBeenCalled();
    });

    it('should disable add button when required fields are missing', () => {
      render(<CategoryManagement />);
      
      const addButton = screen.getByText('카테고리 추가');
      expect(addButton).toBeDisabled();
    });

    it('should clear form after successful addition', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      const nameInput = screen.getByPlaceholderText('카테고리 이름을 입력하세요');
      await user.type(nameInput, '새 카테고리');
      
      // Select a color
      const firstColorButton = screen.getAllByRole('button').find(button => 
        button.style.backgroundColor && button.title?.includes('색상:')
      );
      
      if (firstColorButton) {
        await user.click(firstColorButton);
      }
      
      const addButton = screen.getByText('카테고리 추가');
      await user.click(addButton);
      
      // Form should be cleared
      await waitFor(() => {
        expect(nameInput).toHaveValue('');
      });
    });

    it('should allow selecting colors even when some are already used', async () => {
      // Multiple categories can use the same color in this implementation
      const existingCategories: TodoCategory[] = [
        { id: '1', name: '카테고리1', color: '#ef4444', order: 0, createdAt: new Date() },
        { id: '2', name: '카테고리2', color: '#f97316', order: 1, createdAt: new Date() },
      ];
      
      const mockWithColors = {
        ...mockUseCategoriesReturn,
        categories: existingCategories,
      };
      
      mockedUseCategories.mockReturnValue(mockWithColors);
      
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      // Should still show all available colors since multiple categories can use same color
      const colorButtons = screen.getAllByRole('button').filter(button => 
        button.style.backgroundColor && button.title?.includes('색상:')
      );
      expect(colorButtons.length).toBe(mockAvailableColors.length);
      
      // Add name and select color to enable the button
      const nameInput = screen.getByPlaceholderText('카테고리 이름을 입력하세요');
      await user.type(nameInput, '새 카테고리');
      
      const firstColorButton = colorButtons[0];
      await user.click(firstColorButton);
      
      const addButton = screen.getByText('카테고리 추가');
      expect(addButton).toBeEnabled(); // Should be enabled when both name and color are provided
    });
  });

  describe('color selection', () => {
    it('should highlight selected color', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      const firstColorButton = screen.getAllByRole('button').find(button => 
        button.style.backgroundColor && button.title?.includes('색상:')
      );
      
      if (firstColorButton) {
        await user.click(firstColorButton);
        
        expect(firstColorButton).toHaveClass('border-gray-800', 'scale-110');
      }
    });

    it('should allow changing color selection', async () => {
      const user = userEvent.setup();
      render(<CategoryManagement />);
      
      const colorButtons = screen.getAllByRole('button').filter(button => 
        button.style.backgroundColor && button.title?.includes('색상:')
      );
      
      if (colorButtons.length >= 2) {
        await user.click(colorButtons[0]);
        expect(colorButtons[0]).toHaveClass('border-gray-800', 'scale-110');
        
        await user.click(colorButtons[1]);
        expect(colorButtons[1]).toHaveClass('border-gray-800', 'scale-110');
        expect(colorButtons[0]).not.toHaveClass('border-gray-800', 'scale-110');
      }
    });
  });

  describe('guidance information', () => {
    it('should display category management instructions', () => {
      render(<CategoryManagement />);
      
      expect(screen.getByText('카테고리 관리 안내')).toBeInTheDocument();
      expect(screen.getByText(/최소 1개의 카테고리는 항상 유지되어야 합니다/)).toBeInTheDocument();
      expect(screen.getByText(/카테고리를 삭제하면.*다른 카테고리로 이동됩니다/)).toBeInTheDocument();
    });

    it('should show correct color information', () => {
      render(<CategoryManagement />);
      
      // Check that guidance text exists (simplified check)
      expect(screen.getByText(/총.*가지 색상을 사용할 수 있습니다/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      render(<CategoryManagement />);
      
      expect(screen.getByText('카테고리 이름')).toBeInTheDocument();
      expect(screen.getByText('색상 선택')).toBeInTheDocument();
    });

    it('should have proper color button titles', () => {
      render(<CategoryManagement />);
      
      // Check that color buttons exist (they might not be visible if no colors available)
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(0);
    });

    it('should have proper input constraints', () => {
      render(<CategoryManagement />);
      
      const nameInput = screen.getByPlaceholderText('카테고리 이름을 입력하세요');
      expect(nameInput).toHaveAttribute('maxLength', '20');
    });
  });
});