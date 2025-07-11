import { useState, useCallback, useEffect } from 'react';
import { TodoCategory, CategoryFilter } from '@calendar-todo/shared-types';
import { TodoItem } from '@calendar-todo/shared-types';
import { CategoryService } from '@/services/categoryService';

export const useCategories = () => {
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>({});
  const [loading, setLoading] = useState(true);
  const categoryService = CategoryService.getInstance();

  // 카테고리 목록 로드
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const categories = await categoryService.getCategories();
      setCategories(categories);
      
      // 카테고리 필터도 함께 로드
      const filter = await categoryService.getCategoryFilter();
      setCategoryFilter(filter);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryService]);

  // 초기 로드
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 카테고리 추가
  const addCategory = useCallback(async (name: string, color: string): Promise<TodoCategory | null> => {
    try {
      const newCategory = await categoryService.addCategory(name, color);
      if (newCategory) {
        setCategories(prev => [...prev, newCategory]);
        
        // 새 카테고리는 기본적으로 필터에 포함
        const success = await categoryService.updateCategoryFilter(newCategory.id, true);
        if (success) {
          setCategoryFilter(prev => ({
            ...prev,
            [newCategory.id]: true
          }));
        }
        
        return newCategory;
      }
      return null;
    } catch (error) {
      console.error('Failed to add category:', error);
      return null;
    }
  }, [categoryService]);

  // 카테고리 수정
  const updateCategory = useCallback(async (id: string, updates: { name?: string; color?: string }): Promise<boolean> => {
    try {
      const success = await categoryService.updateCategory(id, updates);
      if (success) {
        setCategories(prev => 
          prev.map(cat =>
            cat.id === id ? { ...cat, ...updates } : cat
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update category:', error);
      return false;
    }
  }, [categoryService]);

  // 카테고리 삭제
  const deleteCategory = useCallback(async (id: string, todos: TodoItem[]): Promise<boolean> => {
    const category = categories.find(cat => cat.id === id);

    // 기본 카테고리는 삭제 불가
    if (!category || category.isDefault) {
      return false;
    }

    // 해당 카테고리를 사용하는 할일이 있는지 확인
    const relatedTodos = todos.filter(todo => todo.category.id === id);
    if (relatedTodos.length > 0) {
      const confirmed = window.confirm(
        `"${category.name}" 카테고리에 ${relatedTodos.length}개의 할일이 있습니다. 정말 삭제하시겠습니까?\n관련된 할일들은 "개인" 카테고리로 이동됩니다.`
      );
      if (!confirmed) {
        return false;
      }
    }

    try {
      const success = await categoryService.deleteCategory(id);
      if (success) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
        
        // 필터에서도 제거
        setCategoryFilter(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete category:', error);
      return false;
    }
  }, [categories, categoryService]);

  // 사용 가능한 색상 반환
  const getAvailableColors = useCallback(async (): Promise<string[]> => {
    try {
      return await categoryService.getAvailableColors();
    } catch (error) {
      console.error('Failed to get available colors:', error);
      return [];
    }
  }, [categoryService]);

  // 카테고리 필터 토글
  const toggleCategoryFilter = useCallback(async (categoryId: string): Promise<boolean> => {
    const newValue = !categoryFilter[categoryId];
    
    try {
      const success = await categoryService.updateCategoryFilter(categoryId, newValue);
      if (success) {
        setCategoryFilter(prev => ({
          ...prev,
          [categoryId]: newValue
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle category filter:', error);
      return false;
    }
  }, [categoryFilter, categoryService]);

  // 필터링된 할일 목록 반환
  const getFilteredTodos = useCallback((todos: TodoItem[]) => {
    return todos.filter(todo => categoryFilter[todo.category?.id] !== false);
  }, [categoryFilter]);

  // ID로 카테고리 찾기
  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  // 새 카테고리가 추가될 때 필터에 자동 추가 (서버에서 처리되므로 불필요)
  // useEffect는 제거함

  return {
    categories,
    categoryFilter,
    loading,
    setCategoryFilter,
    toggleCategoryFilter,
    getFilteredTodos,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getAvailableColors,
    loadCategories, // 새로고침을 위한 함수 추가
  };
};