import { TodoCategory, CategoryFilter } from '@calendar-todo/shared-types';

export class CategoryService {
  private static instance: CategoryService;
  private readonly BASE_URL = '/api/user-settings';

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  private handle401Error(): void {
    console.log('토큰 만료 또는 잘못된 토큰, 로컬 스토리지 정리');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    // 페이지를 새로고침하여 로그인 상태 초기화
    window.location.reload();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
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
}