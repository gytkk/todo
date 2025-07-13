import { TodoItem, TodoStats, TodoCategory } from '@calendar-todo/shared-types';
import { BaseApiClient } from './BaseApiClient';

export class TodoService extends BaseApiClient {
  private static instance: TodoService;
  private readonly BASE_URL = '/api/todos';

  static getInstance(): TodoService {
    if (!TodoService.instance) {
      TodoService.instance = new TodoService();
    }
    return TodoService.instance;
  }


  async getTodos(
    startDate?: string,
    endDate?: string,
    categoryId?: string,
    completed?: boolean
  ): Promise<{ todos: TodoItem[]; stats: TodoStats }> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (categoryId) params.append('categoryId', categoryId);
      if (completed !== undefined) params.append('completed', completed.toString());

      const url = `${this.BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;
      
      console.log('Making request to:', url);
      console.log('Auth token exists:', !!localStorage.getItem('auth_token'));
      
      const response = await this.get<{ todos: TodoItem[]; stats: TodoStats }>(url);

      console.log('Response status:', response.status);

      if (response.status === 401) {
        return { todos: [], stats: { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0 } };
      }
      
      if (response.error || !response.data) {
        throw new Error(`할일 목록 조회 실패: ${response.error || response.status}`);
      }

      const data = response.data;
      
      // 날짜 문자열을 Date 객체로 변환
      const todos = data.todos.map((todo: TodoItem) => ({
        ...todo,
        date: new Date(todo.date),
      }));

      return { todos, stats: data.stats };
    } catch (error) {
      console.error('Error loading todos:', error);
      return { todos: [], stats: { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0 } };
    }
  }

  async addTodo(todo: Omit<TodoItem, 'id'>): Promise<TodoItem | null> {
    try {
      const createRequest = {
        title: todo.title,
        category: {
          ...todo.category,
          createdAt: todo.category.createdAt.toISOString(),
        },
        date: todo.date.toISOString(),
      };

      console.log('TodoService: Sending create request:', createRequest);

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(createRequest),
      });

      console.log('TodoService: Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return null;
        }
        
        // Get the error details from the response
        try {
          const responseText = await response.text();
          console.error('TodoService: Raw error response:', responseText);
          if (responseText.trim()) {
            const errorData = JSON.parse(responseText);
            console.error('TodoService: Parsed error details:', errorData);
          }
        } catch (e) {
          console.error('TodoService: Failed to parse error response:', e);
        }
        
        throw new Error(`할일 생성 실패: ${response.status}`);
      }

      const data = await response.json();
      const newTodo = {
        ...data.todo,
        date: new Date(data.todo.date),
      };

      // 완료 상태가 true인 경우 업데이트
      if (todo.completed) {
        await this.updateTodo(newTodo.id, { completed: true });
        newTodo.completed = true;
      }

      return newTodo;
    } catch (error) {
      console.error('Error adding todo:', error);
      return null;
    }
  }

  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<boolean> {
    try {
      const updateRequest: Record<string, unknown> = {};

      if (updates.title !== undefined) updateRequest.title = updates.title;
      if (updates.completed !== undefined) updateRequest.completed = updates.completed;
      if (updates.category !== undefined) {
        updateRequest.category = {
          ...updates.category,
          createdAt: updates.category.createdAt.toISOString(),
        };
      }
      if (updates.date !== undefined) updateRequest.date = updates.date.toISOString();

      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateRequest),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return false;
        }
        throw new Error(`할일 수정 실패: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating todo:', error);
      return false;
    }
  }

  async toggleTodo(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}/toggle`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handle401Error();
          return false;
        }
        throw new Error(`할일 토글 실패: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error toggling todo:', error);
      return false;
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`할일 삭제 실패: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting todo:', error);
      return false;
    }
  }

  async clearAllTodos(): Promise<boolean> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`모든 할일 삭제 실패: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error clearing todos:', error);
      return false;
    }
  }

  async getStats(): Promise<TodoStats> {
    try {
      const response = await fetch(`${this.BASE_URL}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`통계 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0 };
    }
  }

  async exportTodos(): Promise<Blob> {
    try {
      const { todos } = await this.getTodos();
      const dataStr = JSON.stringify(todos, null, 2);
      return new Blob([dataStr], { type: 'application/json' });
    } catch (error) {
      console.error('Error exporting todos:', error);
      throw new Error('Failed to export todos');
    }
  }

  async importTodos(file: File): Promise<TodoItem[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);

          if (!Array.isArray(importedData)) {
            throw new Error('Invalid file format');
          }

          // Validate and convert todos
          const validatedTodos: Omit<TodoItem, 'id'>[] = importedData.map((item: unknown, index) => {
            const todoItem = item as Record<string, unknown>;
            if (!todoItem.title || !todoItem.date) {
              throw new Error(`Invalid todo item at index ${index}`);
            }

            return {
              title: todoItem.title as string,
              date: new Date(todoItem.date as string),
              completed: Boolean(todoItem.completed),
              category: (todoItem.category as TodoCategory) || { 
                id: 'personal', 
                name: '개인', 
                color: '#f59e0b', 
                isDefault: true,
                createdAt: new Date(),
              },
            };
          });

          // Bulk create todos
          const createdTodos: TodoItem[] = [];
          for (const todo of validatedTodos) {
            const createdTodo = await this.addTodo(todo);
            if (createdTodo) {
              createdTodos.push(createdTodo);
            }
          }

          resolve(createdTodos);
        } catch (error) {
          reject(new Error('Failed to import todos: ' + (error as Error).message));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
