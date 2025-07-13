import { TodoCategory, CategoryFilter } from '@calendar-todo/shared-types';
import { BaseApiClient } from './BaseApiClient';

export class CategoryService extends BaseApiClient {
  private static instance: CategoryService;
  private readonly BASE_URL = '/api/user-settings';

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }


  async getCategories(): Promise<TodoCategory[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/categories`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return [];
        }
        throw new Error(`카테고리 조회 실패: ${response.status}`);
      }

      const data = await response.json();

      // 날짜 문자열을 Date 객체로 변환
      const categories = data.categories.map((category: TodoCategory) => ({
        ...category,
        createdAt: new Date(category.createdAt),
      }));

      return categories;
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  }

  async addCategory(name: string, color: string): Promise<TodoCategory | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/categories`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name, color }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return null;
        }
        throw new Error(`카테고리 생성 실패: ${response.status}`);
      }

      const data = await response.json();
      return {
        ...data.category,
        createdAt: new Date(data.category.createdAt),
      };
    } catch (error) {
      console.error('Error adding category:', error);
      return null;
    }
  }

  async updateCategory(id: string, updates: { name?: string; color?: string }): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return false;
        }
        throw new Error(`카테고리 수정 실패: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return false;
        }
        throw new Error(`카테고리 삭제 실패: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  async getAvailableColors(): Promise<string[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/categories/available-colors`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return [];
        }
        throw new Error(`사용 가능한 색상 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.colors;
    } catch (error) {
      console.error('Error getting available colors:', error);
      return [];
    }
  }

  async getCategoryFilter(): Promise<CategoryFilter> {
    try {
      const response = await fetch(`${this.BASE_URL}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return {};
        }
        throw new Error(`사용자 설정 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.settings?.categoryFilter || {};
    } catch (error) {
      console.error('Error getting category filter:', error);
      return {};
    }
  }

  async updateCategoryFilter(categoryId: string, enabled: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/categories/${categoryId}/filter`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return false;
        }
        throw new Error(`카테고리 필터 업데이트 실패: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating category filter:', error);
      return false;
    }
  }

  async reorderCategories(categoryIds: string[]): Promise<TodoCategory[] | null> {
    try {
      const payload = { categoryIds };
      console.log('CategoryService: Sending reorder request:', payload);

      const response = await fetch(`${this.BASE_URL}/categories/reorder`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('CategoryService: Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return null;
        }
        
        // Get the error details from the response
        let errorMessage = `카테고리 순서 변경 실패: ${response.status}`;
        try {
          const responseText = await response.text();
          console.error('CategoryService: Raw error response:', responseText);

          if (responseText.trim()) {
            const errorData = JSON.parse(responseText);
            console.error('CategoryService: Parsed error details:', errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch (e) {
          console.error('CategoryService: Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('CategoryService: Success response:', data);

      // 날짜 문자열을 Date 객체로 변환
      const categories = data.categories.map((category: TodoCategory) => ({
        ...category,
        createdAt: new Date(category.createdAt),
      }));

      return categories;
    } catch (error) {
      console.error('CategoryService: Error reordering categories:', error);
      return null;
    }
  }
}
