import { TodoItem, TodoStats, TodoCategory, SavedTodoItem } from '@calendar-todo/shared-types';
import { getTempUserId } from '@/utils/tempUser';

/**
 * 미인증 사용자를 위한 로컬 스토리지 기반 할 일 관리 서비스
 */
export class LocalTodoService {
  private static instance: LocalTodoService;
  private readonly STORAGE_KEY = 'local-todos';

  static getInstance(): LocalTodoService {
    if (!LocalTodoService.instance) {
      LocalTodoService.instance = new LocalTodoService();
    }
    return LocalTodoService.instance;
  }

  /**
   * localStorage에서 할 일 목록 로드
   */
  private loadTodos(): TodoItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const savedTodos: SavedTodoItem[] = JSON.parse(stored);
      if (!Array.isArray(savedTodos)) return [];

      return savedTodos.map((todo: SavedTodoItem) => ({
        id: todo.id,
        title: todo.title,
        date: new Date(todo.date),
        completed: todo.completed,
        category: todo.category,
        todoType: todo.todoType || 'event', // 기존 데이터 호환성을 위한 기본값
        userId: todo.userId,
      }));
    } catch (error) {
      console.error('로컬 할 일 로드 오류:', error);
      return [];
    }
  }

  /**
   * localStorage에 할 일 목록 저장
   */
  private saveTodos(todos: TodoItem[]): void {
    try {
      const savedTodos: SavedTodoItem[] = todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        date: todo.date.toISOString(),
        completed: todo.completed,
        category: todo.category,
        todoType: todo.todoType,
        userId: todo.userId,
      }));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedTodos));
    } catch (error) {
      console.error('로컬 할 일 저장 오류:', error);
    }
  }

  /**
   * 통계 계산
   */
  private calculateStats(todos: TodoItem[]): TodoStats {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const incomplete = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 최근 7일 내 완료된 할 일 수
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCompletions = todos.filter(todo => 
      todo.completed && todo.date >= sevenDaysAgo
    ).length;

    return {
      total,
      completed,
      incomplete,
      completionRate,
      recentCompletions,
    };
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 할 일 목록 조회
   */
  async getTodos(
    startDate?: string,
    endDate?: string,
    categoryId?: string,
    completed?: boolean
  ): Promise<{ todos: TodoItem[]; stats: TodoStats }> {
    try {
      let todos = this.loadTodos();

      // 필터링 적용
      if (startDate) {
        const start = new Date(startDate);
        todos = todos.filter(todo => todo.date >= start);
      }

      if (endDate) {
        const end = new Date(endDate);
        todos = todos.filter(todo => todo.date <= end);
      }

      if (categoryId) {
        todos = todos.filter(todo => todo.category.id === categoryId);
      }

      if (completed !== undefined) {
        todos = todos.filter(todo => todo.completed === completed);
      }

      const stats = this.calculateStats(this.loadTodos()); // 전체 통계

      return { todos, stats };
    } catch (error) {
      console.error('로컬 할 일 조회 오류:', error);
      return { 
        todos: [], 
        stats: { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0 } 
      };
    }
  }

  /**
   * 할 일 추가
   */
  async addTodo(todo: Omit<TodoItem, 'id'>): Promise<TodoItem | null> {
    try {
      const todos = this.loadTodos();
      const tempUserId = getTempUserId();

      const newTodo: TodoItem = {
        id: this.generateId(),
        title: todo.title,
        date: todo.date,
        completed: todo.completed,
        category: todo.category,
        todoType: todo.todoType,
        userId: tempUserId,
      };

      todos.push(newTodo);
      this.saveTodos(todos);

      return newTodo;
    } catch (error) {
      console.error('로컬 할 일 추가 오류:', error);
      return null;
    }
  }

  /**
   * 할 일 수정
   */
  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<boolean> {
    try {
      const todos = this.loadTodos();
      const index = todos.findIndex(todo => todo.id === id);

      if (index === -1) {
        return false;
      }

      // 업데이트 적용
      if (updates.title !== undefined) todos[index].title = updates.title;
      if (updates.completed !== undefined) todos[index].completed = updates.completed;
      if (updates.category !== undefined) todos[index].category = updates.category;
      if (updates.date !== undefined) todos[index].date = updates.date;

      this.saveTodos(todos);
      return true;
    } catch (error) {
      console.error('로컬 할 일 수정 오류:', error);
      return false;
    }
  }

  /**
   * 할 일 완료 상태 토글
   */
  async toggleTodo(id: string): Promise<boolean> {
    try {
      const todos = this.loadTodos();
      const todo = todos.find(t => t.id === id);

      if (!todo) {
        return false;
      }

      todo.completed = !todo.completed;
      this.saveTodos(todos);
      return true;
    } catch (error) {
      console.error('로컬 할 일 토글 오류:', error);
      return false;
    }
  }

  /**
   * 할 일 삭제
   */
  async deleteTodo(id: string): Promise<boolean> {
    try {
      const todos = this.loadTodos();
      const filteredTodos = todos.filter(todo => todo.id !== id);

      if (filteredTodos.length === todos.length) {
        return false; // 삭제할 할 일이 없음
      }

      this.saveTodos(filteredTodos);
      return true;
    } catch (error) {
      console.error('로컬 할 일 삭제 오류:', error);
      return false;
    }
  }

  /**
   * 모든 할 일 삭제
   */
  async clearAllTodos(): Promise<boolean> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('로컬 할 일 전체 삭제 오류:', error);
      return false;
    }
  }

  /**
   * 통계 조회
   */
  async getStats(): Promise<TodoStats> {
    try {
      const todos = this.loadTodos();
      return this.calculateStats(todos);
    } catch (error) {
      console.error('로컬 통계 조회 오류:', error);
      return { total: 0, completed: 0, incomplete: 0, completionRate: 0, recentCompletions: 0 };
    }
  }

  /**
   * 할 일 데이터 내보내기
   */
  async exportTodos(): Promise<Blob> {
    try {
      const todos = this.loadTodos();
      const dataStr = JSON.stringify(todos, null, 2);
      return new Blob([dataStr], { type: 'application/json' });
    } catch (error) {
      console.error('로컬 할 일 내보내기 오류:', error);
      throw new Error('할 일 내보내기 실패');
    }
  }

  /**
   * 할 일 데이터 가져오기
   */
  async importTodos(file: File): Promise<TodoItem[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);

          if (!Array.isArray(importedData)) {
            throw new Error('잘못된 파일 형식');
          }

          const currentTodos = this.loadTodos();
          const tempUserId = getTempUserId();

          // 가져온 데이터 검증 및 변환
          const validatedTodos: TodoItem[] = importedData.map((item: unknown, index) => {
            const todoItem = item as Record<string, unknown>;
            if (!todoItem.title || !todoItem.date) {
              throw new Error(`${index}번째 할 일 항목이 잘못되었습니다`);
            }

            return {
              id: this.generateId(), // 새로운 ID 생성
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
              userId: tempUserId,
            };
          });

          // 기존 할 일과 합치기
          const allTodos = [...currentTodos, ...validatedTodos];
          this.saveTodos(allTodos);

          resolve(validatedTodos);
        } catch (error) {
          reject(new Error('할 일 가져오기 실패: ' + (error as Error).message));
        }
      };

      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsText(file);
    });
  }

  /**
   * 로컬 데이터 존재 여부 확인
   */
  hasLocalData(): boolean {
    const todos = this.loadTodos();
    return todos.length > 0;
  }

  /**
   * 로컬 데이터를 서버로 마이그레이션하기 위한 데이터 반환
   */
  getTodosForMigration(): TodoItem[] {
    return this.loadTodos();
  }

  /**
   * 로컬 데이터 백업
   */
  async backupTodos(): Promise<void> {
    try {
      const todos = this.loadTodos();
      const backupData = {
        timestamp: new Date().toISOString(),
        todos,
      };

      localStorage.setItem(`${this.STORAGE_KEY}_backup`, JSON.stringify(backupData));
    } catch (error) {
      console.error('로컬 할 일 백업 오류:', error);
    }
  }

  /**
   * 로컬 데이터 복원
   */
  async restoreFromBackup(): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(`${this.STORAGE_KEY}_backup`);
      if (!backupData) return false;

      const backup = JSON.parse(backupData);
      if (!backup.todos || !Array.isArray(backup.todos)) return false;

      this.saveTodos(backup.todos);
      return true;
    } catch (error) {
      console.error('로컬 할 일 복원 오류:', error);
      return false;
    }
  }

  /**
   * 백업 데이터 삭제
   */
  async clearBackup(): Promise<void> {
    localStorage.removeItem(`${this.STORAGE_KEY}_backup`);
  }
}