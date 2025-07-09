import { TodoItem, SavedTodoItem } from '@calendar-todo/shared-types';
import { TodoService } from './todoService';

export interface MigrationStats {
  totalFound: number;
  totalMigrated: number;
  totalFailed: number;
  errors: string[];
}

export class MigrationService {
  private static instance: MigrationService;
  private readonly LOCAL_STORAGE_KEY = 'calendar-todos';

  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  /**
   * 로컬 스토리지에서 할일 데이터를 읽어온다
   */
  async getLocalTodos(): Promise<TodoItem[]> {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!stored) return [];

      const savedTodos: SavedTodoItem[] = JSON.parse(stored);
      if (!Array.isArray(savedTodos)) return [];

      return savedTodos.map((todo: SavedTodoItem) => ({
        id: todo.id,
        title: todo.title,
        date: new Date(todo.date),
        completed: todo.completed,
        category: todo.category || {
          id: 'personal',
          name: '개인',
          color: '#4ECDC4',
          isDefault: false,
          createdAt: new Date(),
        },
        userId: todo.userId,
      }));
    } catch (error) {
      console.error('로컬 스토리지 데이터 읽기 오류:', error);
      return [];
    }
  }

  /**
   * 로컬 스토리지에 할일 데이터가 있는지 확인
   */
  async hasLocalData(): Promise<boolean> {
    const localTodos = await this.getLocalTodos();
    return localTodos.length > 0;
  }

  /**
   * 로컬 스토리지의 할일 데이터를 백엔드로 마이그레이션
   */
  async migrateToServer(): Promise<MigrationStats> {
    const localTodos = await this.getLocalTodos();
    const stats: MigrationStats = {
      totalFound: localTodos.length,
      totalMigrated: 0,
      totalFailed: 0,
      errors: [],
    };

    if (localTodos.length === 0) {
      return stats;
    }

    const todoService = TodoService.getInstance();

    for (const todo of localTodos) {
      try {
        const todoToCreate: Omit<TodoItem, 'id'> = {
          title: todo.title,
          date: todo.date,
          completed: todo.completed,
          category: todo.category,
        };

        const createdTodo = await todoService.addTodo(todoToCreate);
        if (createdTodo) {
          stats.totalMigrated++;
        } else {
          stats.totalFailed++;
          stats.errors.push(`할일 "${todo.title}" 생성 실패`);
        }
      } catch (error) {
        stats.totalFailed++;
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        stats.errors.push(`할일 "${todo.title}" 마이그레이션 실패: ${errorMessage}`);
      }
    }

    return stats;
  }

  /**
   * 마이그레이션 후 로컬 스토리지 데이터 백업
   */
  async backupLocalData(): Promise<void> {
    const localTodos = await this.getLocalTodos();
    const backupData = {
      timestamp: new Date().toISOString(),
      todos: localTodos,
    };

    localStorage.setItem(`${this.LOCAL_STORAGE_KEY}_backup`, JSON.stringify(backupData));
  }

  /**
   * 마이그레이션 후 로컬 스토리지 데이터 삭제
   */
  async clearLocalData(): Promise<void> {
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
  }

  /**
   * 백업된 데이터를 복원
   */
  async restoreFromBackup(): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(`${this.LOCAL_STORAGE_KEY}_backup`);
      if (!backupData) return false;

      const backup = JSON.parse(backupData);
      if (!backup.todos || !Array.isArray(backup.todos)) return false;

      const savedTodos: SavedTodoItem[] = backup.todos.map((todo: TodoItem) => ({
        id: todo.id,
        title: todo.title,
        date: todo.date.toISOString(),
        completed: todo.completed,
        category: todo.category,
        userId: todo.userId,
      }));

      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(savedTodos));
      return true;
    } catch (error) {
      console.error('백업 복원 오류:', error);
      return false;
    }
  }

  /**
   * 백업 데이터 삭제
   */
  async clearBackup(): Promise<void> {
    localStorage.removeItem(`${this.LOCAL_STORAGE_KEY}_backup`);
  }

  /**
   * 완전한 마이그레이션 프로세스 실행
   */
  async performFullMigration(): Promise<MigrationStats> {
    // 1. 로컬 데이터 백업
    await this.backupLocalData();

    // 2. 마이그레이션 실행
    const stats = await this.migrateToServer();

    // 3. 마이그레이션 성공 시 로컬 데이터 삭제
    if (stats.totalFailed === 0) {
      await this.clearLocalData();
    }

    return stats;
  }

  /**
   * 마이그레이션 상태 확인
   */
  async getMigrationStatus(): Promise<{
    hasLocalData: boolean;
    hasBackup: boolean;
    localTodosCount: number;
  }> {
    const hasLocalData = await this.hasLocalData();
    const hasBackup = localStorage.getItem(`${this.LOCAL_STORAGE_KEY}_backup`) !== null;
    const localTodos = await this.getLocalTodos();

    return {
      hasLocalData,
      hasBackup,
      localTodosCount: localTodos.length,
    };
  }
}