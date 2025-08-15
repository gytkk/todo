import { useState, useCallback, useEffect } from 'react';
import { TodoCategory, CategoryFilter, UserSettingsData } from '@calendar-todo/shared-types';
import { TodoItem } from '@calendar-todo/shared-types';
import { CategoryService } from '@/services/categoryService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedCallback } from './useAuthenticatedCallback';
import { DEFAULT_CATEGORIES, STORAGE_KEYS } from '@/constants/categories';

// 저장된 사용자 설정 로드 헬퍼 함수
const getStoredUserSettings = (): UserSettingsData | null => {
  try {
    const settingsData = localStorage.getItem('user_settings') || sessionStorage.getItem('user_settings');
    // Check for null, empty string, or "undefined" string
    if (!settingsData || settingsData === 'undefined' || settingsData === 'null') {
      return null;
    }
    return JSON.parse(settingsData);
  } catch (error) {
    console.error('Failed to parse stored user settings:', error);
    // Clear invalid data from storage
    localStorage.removeItem('user_settings');
    sessionStorage.removeItem('user_settings');
    return null;
  }
};

export const useCategories = () => {
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>({});
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // 카테고리 목록 로드
  const loadCategories = useCallback(async () => {
    if (!isAuthenticated) {
      // 미인증 사용자에게는 기본 카테고리 2개 제공
      setCategories(DEFAULT_CATEGORIES);
      
      // localStorage에서 카테고리 필터 상태 복원
      try {
        const savedFilter = localStorage.getItem(STORAGE_KEYS.CATEGORY_FILTER);
        if (savedFilter && savedFilter !== 'undefined' && savedFilter !== 'null') {
          setCategoryFilter(JSON.parse(savedFilter));
        } else {
          // 기본 카테고리 필터 설정 (모두 활성화)
          const defaultFilter = DEFAULT_CATEGORIES.reduce((filter, cat) => {
            filter[cat.id] = true;
            return filter;
          }, {} as CategoryFilter);
          setCategoryFilter(defaultFilter);
          localStorage.setItem(STORAGE_KEYS.CATEGORY_FILTER, JSON.stringify(defaultFilter));
        }
      } catch (error) {
        console.error('Failed to load category filter from localStorage:', error);
        // 기본 카테고리 필터 설정 (모두 활성화)
        const defaultFilter = DEFAULT_CATEGORIES.reduce((filter, cat) => {
          filter[cat.id] = true;
          return filter;
        }, {} as CategoryFilter);
        setCategoryFilter(defaultFilter);
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 먼저 저장된 사용자 설정 확인 (로그인 시 받은 데이터)
      const storedSettings = getStoredUserSettings();
      if (storedSettings) {
        // 저장된 설정에서 카테고리와 필터 복원
        const categories: TodoCategory[] = storedSettings.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          createdAt: cat.createdAt,
          order: cat.order || 0
        }));
        
        setCategories(categories);
        setCategoryFilter(storedSettings.categoryFilter);
        
        // 확장된 설정들 로그 출력 (개발용)
        console.log('로그인 시 로드된 사용자 설정:', {
          autoMoveTodos: storedSettings.autoMoveTodos,
          theme: storedSettings.theme,
          language: storedSettings.language,
          dateFormat: storedSettings.dateFormat,
          notifications: storedSettings.notifications
        });
        
        setLoading(false);
        return;
      }
      
      // 저장된 설정이 없으면 API 호출
      const service = CategoryService.getInstance();
      const categories = await service.getCategories();
      
      // Hydration 안전성을 위한 검증
      if (Array.isArray(categories)) {
        setCategories(categories);
      } else {
        console.warn('Invalid categories data received:', categories);
        setCategories(DEFAULT_CATEGORIES);
      }
      
      // 카테고리 필터도 함께 로드
      const filter = await service.getCategoryFilter();
      if (filter && typeof filter === 'object') {
        setCategoryFilter(filter);
      } else {
        console.warn('Invalid category filter received:', filter);
        // 기본 필터 설정 (모두 활성화)
        const defaultFilter = categories.reduce((acc, cat) => {
          acc[cat.id] = true;
          return acc;
        }, {} as CategoryFilter);
        setCategoryFilter(defaultFilter);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // 에러 시 기본 카테고리 설정
      setCategories(DEFAULT_CATEGORIES);
      const defaultFilter = DEFAULT_CATEGORIES.reduce((acc, cat) => {
        acc[cat.id] = true;
        return acc;
      }, {} as CategoryFilter);
      setCategoryFilter(defaultFilter);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // 인증 상태 변경 시 로드
  useEffect(() => {
    if (!authLoading) {
      loadCategories();
    }
  }, [authLoading, isAuthenticated]); // loadCategories 제거하여 무한 재렌더링 방지

  // 카테고리 추가
  const addCategory = useAuthenticatedCallback(
    async (name: string, color: string): Promise<TodoCategory | null> => {
      try {
        const service = CategoryService.getInstance();
        const newCategory = await service.addCategory(name, color);
        if (newCategory) {
          // 즉시 로컬 상태 업데이트
          setCategories(prev => [...prev, newCategory]);
          
          // 새 카테고리는 기본적으로 필터에 포함
          const success = await service.updateCategoryFilter(newCategory.id, true);
          if (success) {
            setCategoryFilter(prev => ({
              ...prev,
              [newCategory.id]: true
            }));
          }
          
          // 서버에서 최신 상태를 다시 가져와서 동기화 확인
          setTimeout(() => {
            loadCategories();
          }, 100);
          
          return newCategory;
        }
        return null;
      } catch (error) {
        console.error('Failed to add category:', error);
        return null;
      }
    },
    Promise.resolve(null), // fallback value
    [] // deps
  );

  // 카테고리 수정
  const updateCategory = useAuthenticatedCallback(
    async (id: string, updates: { name?: string; color?: string }): Promise<boolean> => {
      try {
        const service = CategoryService.getInstance();
        const success = await service.updateCategory(id, updates);
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
    },
    Promise.resolve(false), // fallback value
    [] // deps
  );

  // 카테고리 삭제
  const deleteCategory = useAuthenticatedCallback(
    async (id: string, todos: TodoItem[]): Promise<boolean> => {
      const category = categories.find(cat => cat.id === id);

      // 최소 1개 카테고리는 유지해야 함
      if (!category || categories.length <= 1) {
        return false;
      }

      // 해당 카테고리를 사용하는 할일이 있는지 확인
      const relatedTodos = todos.filter(todo => todo.category.id === id);
      if (relatedTodos.length > 0) {
        const confirmed = window.confirm(
          `"${category.name}" 카테고리에 ${relatedTodos.length}개의 할일이 있습니다. 정말 삭제하시겠습니까?\n관련된 할일들은 다른 카테고리로 이동됩니다.`
        );
        if (!confirmed) {
          return false;
        }
      }

      try {
        const service = CategoryService.getInstance();
        const success = await service.deleteCategory(id);
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
    },
    Promise.resolve(false), // fallback value
    [categories] // deps
  );

  // 사용 가능한 색상 반환
  const getAvailableColors = useAuthenticatedCallback(
    async (): Promise<string[]> => {
      try {
        const service = CategoryService.getInstance();
        return await service.getAvailableColors();
      } catch (error) {
        console.error('Failed to get available colors:', error);
        return [];
      }
    },
    Promise.resolve([]), // fallback value
    [] // deps
  );

  // 카테고리 필터 토글
  const toggleCategoryFilter = useCallback(
    async (categoryId: string): Promise<boolean> => {
      const newValue = !categoryFilter[categoryId];
      
      if (!isAuthenticated) {
        // 미인증 사용자: localStorage에 상태 저장
        try {
          const updatedFilter = {
            ...categoryFilter,
            [categoryId]: newValue
          };
          setCategoryFilter(updatedFilter);
          localStorage.setItem(STORAGE_KEYS.CATEGORY_FILTER, JSON.stringify(updatedFilter));
          return true;
        } catch (error) {
          console.error('Failed to save category filter to localStorage:', error);
          return false;
        }
      }
      
      // 인증 사용자: 서버에 상태 저장
      try {
        const service = CategoryService.getInstance();
        const success = await service.updateCategoryFilter(categoryId, newValue);
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
    },
    [categoryFilter, isAuthenticated] // deps
  );

  // 필터링된 할일 목록 반환
  const getFilteredTodos = useCallback((todos: TodoItem[]) => {
    return todos.filter(todo => categoryFilter[todo.category?.id] !== false);
  }, [categoryFilter]);

  // ID로 카테고리 찾기
  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  // 카테고리 순서 변경
  const reorderCategories = useAuthenticatedCallback(
    async (categoryIds: string[]): Promise<boolean> => {
      try {
        const service = CategoryService.getInstance();
        const result = await service.reorderCategories(categoryIds);
        if (result !== null) {
          // 순서 변경 성공시 카테고리 목록을 다시 로드
          await loadCategories();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to reorder categories:', error);
        return false;
      }
    },
    Promise.resolve(false), // fallback value
    [] // deps
  );

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
    reorderCategories,
    loadCategories, // 새로고침을 위한 함수 추가
  };
};