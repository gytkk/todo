import { TodoItem, SavedTodoItem, TodoType } from '@calendar-todo/shared-types';
import { TodoService } from './todoService';
import { LocalTodoService } from './localTodoService';

export interface MigrationStats {
  totalFound: number;
  totalMigrated: number;
  totalFailed: number;
  errors: string[];
}

export class MigrationService {
  private static instance: MigrationService;
  private readonly LOCAL_STORAGE_KEY = 'calendar-todos';
  private readonly NEW_LOCAL_STORAGE_KEY = 'local-todos';

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
      if (!stored || stored === 'undefined' || stored === 'null') return [];

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
        todoType: (todo as SavedTodoItem & { todoType?: TodoType }).todoType || 'event', // 기본값: 이벤트
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
          todoType: todo.todoType || 'event', // 기본값: 이벤트
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
      if (!backupData || backupData === 'undefined' || backupData === 'null') return false;

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

  /**
   * 미인증 사용자의 로컬 데이터를 인증된 사용자 계정으로 마이그레이션
   */
  async migrateLocalToServer(): Promise<MigrationStats> {
    const localTodoService = LocalTodoService.getInstance();
    const localTodos = localTodoService.getTodosForMigration();
    
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
          todoType: todo.todoType || 'event', // 기본값: 이벤트
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

    // 마이그레이션 성공 시 로컬 데이터 백업 후 삭제
    if (stats.totalFailed === 0) {
      await localTodoService.backupTodos();
      await localTodoService.clearAllTodos();
    }

    return stats;
  }

  /**
   * 인증된 사용자의 서버 데이터를 로컬로 백업 (로그아웃 시)
   */
  async migrateServerToLocal(): Promise<MigrationStats> {
    const todoService = TodoService.getInstance();
    const localTodoService = LocalTodoService.getInstance();
    
    const stats: MigrationStats = {
      totalFound: 0,
      totalMigrated: 0,
      totalFailed: 0,
      errors: [],
    };

    try {
      const { todos: serverTodos } = await todoService.getTodos();
      stats.totalFound = serverTodos.length;

      if (serverTodos.length === 0) {
        return stats;
      }

      // 기존 로컬 데이터 백업
      if (localTodoService.hasLocalData()) {
        await localTodoService.backupTodos();
      }

      for (const todo of serverTodos) {
        try {
          const todoToCreate: Omit<TodoItem, 'id'> = {
            title: todo.title,
            date: todo.date,
            completed: todo.completed,
            category: todo.category,
            todoType: todo.todoType || 'event', // 기본값: 이벤트
          };

          const createdTodo = await localTodoService.addTodo(todoToCreate);
          if (createdTodo) {
            stats.totalMigrated++;
          } else {
            stats.totalFailed++;
            stats.errors.push(`할일 "${todo.title}" 로컬 저장 실패`);
          }
        } catch (error) {
          stats.totalFailed++;
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          stats.errors.push(`할일 "${todo.title}" 로컬 마이그레이션 실패: ${errorMessage}`);
        }
      }
    } catch (error) {
      stats.errors.push('서버 데이터 조회 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }

    return stats;
  }

  /**
   * 로그인 시 실행할 마이그레이션 프로세스
   */
  async performLoginMigration(): Promise<MigrationStats> {
    const localTodoService = LocalTodoService.getInstance();
    
    // 로컬에 데이터가 있는 경우에만 마이그레이션 실행
    if (localTodoService.hasLocalData()) {
      return await this.migrateLocalToServer();
    }

    return {
      totalFound: 0,
      totalMigrated: 0,
      totalFailed: 0,
      errors: [],
    };
  }

  /**
   * 로그아웃 시 실행할 마이그레이션 프로세스 (선택적)
   */
  async performLogoutMigration(enableBackup: boolean = true): Promise<MigrationStats> {
    if (!enableBackup) {
      return {
        totalFound: 0,
        totalMigrated: 0,
        totalFailed: 0,
        errors: [],
      };
    }

    return await this.migrateServerToLocal();
  }

  /**
   * 전체 마이그레이션 상태 조회
   */
  async getCompleteMigrationStatus(): Promise<{
    hasOldLocalData: boolean;
    hasNewLocalData: boolean;
    hasBackup: boolean;
    oldLocalTodosCount: number;
    newLocalTodosCount: number;
    canMigrateToServer: boolean;
    canRestoreFromLocal: boolean;
  }> {
    const oldHasLocalData = await this.hasLocalData();
    const oldLocalTodos = await this.getLocalTodos();
    
    const localTodoService = LocalTodoService.getInstance();
    const newHasLocalData = localTodoService.hasLocalData();
    const newLocalTodos = localTodoService.getTodosForMigration();
    
    const hasBackup = localStorage.getItem(`${this.NEW_LOCAL_STORAGE_KEY}_backup`) !== null;

    return {
      hasOldLocalData: oldHasLocalData,
      hasNewLocalData: newHasLocalData,
      hasBackup,
      oldLocalTodosCount: oldLocalTodos.length,
      newLocalTodosCount: newLocalTodos.length,
      canMigrateToServer: newHasLocalData,
      canRestoreFromLocal: hasBackup,
    };
  }
}