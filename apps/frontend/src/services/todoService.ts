import { TodoItem, TodoStats, TodoCategory, TodoType } from '@calendar-todo/shared-types';
import { BaseApiClient } from './BaseApiClient';


interface MoveTasksResponse {
  success?: boolean;
  message: string;
  movedCount: number;
  movedTaskIds: string[];
}

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

      const response = await this.get<{ todos: TodoItem[]; stats: TodoStats }>(url);

      if (response.status === 401) {
        return { todos: [], stats: { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0, byType: { event: { total: 0, completed: 0, incomplete: 0 }, task: { total: 0, completed: 0, incomplete: 0 } } } };
      }

      if (response.error || !response.data) {
        throw new Error(`할일 목록 조회 실패: ${response.error || response.status}`);
      }

      const data = response.data;

      // Hydration 안전성을 위한 더 엄격한 데이터 검증
      if (!data || typeof data !== 'object') {
        console.warn('Invalid response data:', data);
        return { 
          todos: [], 
          stats: { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0, byType: { event: { total: 0, completed: 0, incomplete: 0 }, task: { total: 0, completed: 0, incomplete: 0 } } } 
        };
      }

      // todos 필드 검증
      const todos = Array.isArray(data.todos) ? data.todos : [];
      if (!data.todos) {
        console.warn('data.todos is undefined, using empty array');
      } else if (!Array.isArray(data.todos)) {
        console.warn('data.todos is not an array:', typeof data.todos, data.todos);
      }

      // stats 필드 검증  
      const defaultStats = { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0, byType: { event: { total: 0, completed: 0, incomplete: 0 }, task: { total: 0, completed: 0, incomplete: 0 } } };
      const stats = (data.stats && typeof data.stats === 'object') ? data.stats : defaultStats;

      // 날짜 문자열을 Date 객체로 변환 (안전한 처리)
      const processedTodos = todos.map((todo: TodoItem) => {
        const date = todo.date ? new Date(todo.date) : new Date();
        // 유효하지 않은 날짜는 현재 날짜로 대체
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found in todo, using current date:', todo);
          return { ...todo, date: new Date() };
        }
        return { ...todo, date };
      });

      return { todos: processedTodos, stats };
    } catch (error) {
      console.error('Error loading todos:', error);
      return { todos: [], stats: { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0, byType: { event: { total: 0, completed: 0, incomplete: 0 }, task: { total: 0, completed: 0, incomplete: 0 } } } };
    }
  }

  async addTodo(todo: Omit<TodoItem, 'id'>): Promise<TodoItem | null> {
    try {
      const createRequest = {
        title: todo.title,
        categoryId: todo.category.id,
        todoType: todo.todoType,
        date: this.convertDateToISO(todo.date),
      };

      const response = await this.post<{ todo: TodoItem }>(this.BASE_URL, createRequest);

      if (response.status === 401) {
        return null;
      }

      if (response.error || !response.data) {
        this.logError(`할일 생성 실패: ${response.error || response.status}`);
        return null;
      }

      const newTodo = this.convertResponseDates(response.data.todo, ['date', 'category.createdAt']);

      // 완료 상태가 true인 경우 업데이트
      if (todo.completed) {
        await this.updateTodo(newTodo.id, { completed: true });
        newTodo.completed = true;
      }

      return newTodo;
    } catch (error) {
      this.logError('Error adding todo', error);
      return null;
    }
  }

  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<boolean> {
    try {
      const updateRequest: Record<string, unknown> = {};

      if (updates.title !== undefined) updateRequest.title = updates.title;
      if (updates.completed !== undefined) updateRequest.completed = updates.completed;
      if (updates.category !== undefined) {
        updateRequest.categoryId = updates.category.id;
      }
      if (updates.date !== undefined) updateRequest.date = this.convertDateToISO(updates.date);

      const response = await this.put(`${this.BASE_URL}/${id}`, updateRequest);

      if (response.status === 401) {
        return false;
      }

      if (response.error) {
        this.logError(`할일 수정 실패: ${response.error}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logError('Error updating todo', error);
      return false;
    }
  }

  async toggleTodo(id: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.BASE_URL}/${id}/toggle`, {
        method: 'PATCH',
      });

      if (response.status === 401) {
        return false;
      }

      if (response.error) {
        this.logError(`할일 토글 실패: ${response.error}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logError('Error toggling todo', error);
      return false;
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      const response = await this.delete(`${this.BASE_URL}/${id}`);

      if (response.error) {
        this.logError(`할일 삭제 실패: ${response.error}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logError('Error deleting todo', error);
      return false;
    }
  }

  async clearAllTodos(): Promise<boolean> {
    try {
      const response = await this.delete(this.BASE_URL);

      if (response.error) {
        this.logError(`모든 할일 삭제 실패: ${response.error}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logError('Error clearing todos', error);
      return false;
    }
  }

  async getStats(): Promise<TodoStats> {
    try {
      const response = await this.get<{ stats: TodoStats }>(`${this.BASE_URL}/stats`);

      if (response.error || !response.data) {
        this.logError(`통계 조회 실패: ${response.error || response.status}`);
        return { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0, byType: { event: { total: 0, completed: 0, incomplete: 0 }, task: { total: 0, completed: 0, incomplete: 0 } } };
      }

      return response.data.stats;
    } catch (error) {
      this.logError('Error getting stats', error);
      return { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0, byType: { event: { total: 0, completed: 0, incomplete: 0 }, task: { total: 0, completed: 0, incomplete: 0 } } };
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

            const date = new Date(todoItem.date as string);
            if (isNaN(date.getTime())) {
              throw new Error(`Invalid date in todo item at index ${index}`);
            }

            return {
              title: todoItem.title as string,
              date,
              completed: Boolean(todoItem.completed),
              category: (todoItem.category as TodoCategory) || {
                id: 'personal',
                name: '개인',
                color: '#f59e0b',
                isDefault: true,
                createdAt: new Date(),
              },
              todoType: (todoItem.todoType as TodoType) || 'event', // 기본값: 이벤트
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

  /**
   * 미완료 작업들을 오늘로 이동
   */
  async moveTasks(): Promise<MoveTasksResponse | null> {
    try {
      // 먼저 오늘 이전의 미완료 태스크들을 조회
      const dueTasks = await this.get<TodoItem[]>('/api/todos/tasks-due');

      if (dueTasks.error || !dueTasks.data || dueTasks.data.length === 0) {
        // 이동할 태스크가 없으면 성공으로 처리
        return {
          success: true,
          message: '이동할 미완료 태스크가 없습니다',
          movedCount: 0,
          movedTaskIds: []
        };
      }

      // 태스크 ID들을 추출
      if (!dueTasks.data || !Array.isArray(dueTasks.data)) {
        return {
          success: true,
          message: '이동할 미완료 태스크가 없습니다',
          movedCount: 0,
          movedTaskIds: []
        };
      }
      
      const taskIds = dueTasks.data.map((task: TodoItem) => task.id);
      
      // 빈 배열인 경우 API 호출하지 않고 성공 응답 반환
      if (taskIds.length === 0) {
        return {
          success: true,
          message: '이동할 미완료 태스크가 없습니다',
          movedCount: 0,
          movedTaskIds: []
        };
      }
      
      // 오늘 날짜를 시작 시간(00:00:00)으로 설정
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // 태스크들을 오늘로 이동
      const response = await this.post<MoveTasksResponse>('/api/todos/move-tasks', {
        taskIds,
        newDate: todayISO
      });

      if (response.status === 401) {
        return null;
      }

      if (response.error || !response.data) {
        this.logError(`작업 이동 실패: ${response.error || response.status}`);
        return null;
      }

      return response.data;
    } catch (error) {
      this.logError('작업 이동 중 오류 발생:', error);
      return null;
    }
  }

  /**
   * 이동 대상 작업들 조회
   */
  async getTasksDue(): Promise<{ data: TodoItem[] } | null> {
    try {
      const response = await this.get<TodoItem[]>('/api/todos/tasks-due');

      if (response.status === 401) {
        return null;
      }

      if (response.error || !response.data) {
        this.logError(`이동 대상 작업 조회 실패: ${response.error || response.status}`);
        return null;
      }

      // 데이터 유효성 검증 및 날짜 문자열을 Date 객체로 변환
      if (!response.data || !Array.isArray(response.data)) {
        return { data: [] };
      }
      const tasks = response.data.map((task: TodoItem) => {
        const date = task.date ? new Date(task.date) : new Date();
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found in task, using current date:', task);
          return { ...task, date: new Date() };
        }
        return { ...task, date };
      });

      return { data: tasks };
    } catch (error) {
      this.logError('이동 대상 작업 조회 중 오류 발생:', error);
      return null;
    }
  }
}
