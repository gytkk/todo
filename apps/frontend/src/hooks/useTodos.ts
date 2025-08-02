import { useCallback, useState, useEffect } from 'react';
import { TodoItem, TodoStats, TodoCategory, TodoType } from '@calendar-todo/shared-types';
import { format } from 'date-fns';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { TodoService } from '@/services/todoService';
import { LocalTodoService } from '@/services/localTodoService';
import { useAuth } from '@/contexts/AuthContext';

export const useTodos = (categories: TodoCategory[] = DEFAULT_CATEGORIES) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [stats, setStats] = useState<TodoStats>({
    total: 0,
    completed: 0,
    incomplete: 0,
    completionRate: 0,
    recentCompletions: 0,
    byType: {
      event: { total: 0, completed: 0, incomplete: 0 },
      task: { total: 0, completed: 0, incomplete: 0 }
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Load todos from API or localStorage
  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        // 인증된 사용자: API에서 데이터 로드
        const todoService = TodoService.getInstance();
        const { todos: apiTodos, stats: apiStats } = await todoService.getTodos();
        setTodos(apiTodos);
        setStats(apiStats);
      } else {
        // 미인증 사용자: 로컬 스토리지에서 데이터 로드
        const localTodoService = LocalTodoService.getInstance();
        const { todos: localTodos, stats: localStats } = await localTodoService.getTodos();
        setTodos(localTodos);
        setStats(localStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일을 불러오는 중 오류가 발생했습니다');
      // 오류 발생 시 빈 상태로 초기화
      setTodos([]);
      setStats({
        total: 0,
        completed: 0,
        incomplete: 0,
        completionRate: 0,
        recentCompletions: 0,
        byType: {
          event: { total: 0, completed: 0, incomplete: 0 },
          task: { total: 0, completed: 0, incomplete: 0 }
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load todos when authentication state changes
  useEffect(() => {
    if (!authLoading) {
      loadTodos();
    }
  }, [authLoading, loadTodos]);

  const addTodo = useCallback(async (title: string, date: Date, categoryId: string, todoType: TodoType = 'event') => {
    if (!title.trim() || !date || !categoryId) return;

    const category = categories.find(cat => cat.id === categoryId) || 
                   categories.find(cat => cat.id === 'personal') || 
                   DEFAULT_CATEGORIES[0]; // 올바른 인덱스 사용 (기본값: 개인 카테고리)

    const newTodo: Omit<TodoItem, 'id'> = {
      title: title.trim(),
      date,
      completed: false,
      category,
      todoType,
    };

    try {
      let createdTodo: TodoItem | null = null;
      
      if (isAuthenticated) {
        // 인증된 사용자: API를 통해 추가
        const todoService = TodoService.getInstance();
        createdTodo = await todoService.addTodo(newTodo);
      } else {
        // 미인증 사용자: 로컬 스토리지에 추가
        const localTodoService = LocalTodoService.getInstance();
        createdTodo = await localTodoService.addTodo(newTodo);
      }

      if (createdTodo) {
        setTodos(prevTodos => [...prevTodos, createdTodo]);
        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          total: prevStats.total + 1,
          incomplete: prevStats.incomplete + 1,
          completionRate: Math.round((prevStats.completed / (prevStats.total + 1)) * 100),
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일 추가 중 오류가 발생했습니다');
    }
  }, [categories, isAuthenticated]);

  const toggleTodo = useCallback(async (id: string) => {
    try {
      let success = false;
      
      if (isAuthenticated) {
        // 인증된 사용자: API를 통해 토글
        const todoService = TodoService.getInstance();
        success = await todoService.toggleTodo(id);
      } else {
        // 미인증 사용자: 로컬 스토리지에서 토글
        const localTodoService = LocalTodoService.getInstance();
        success = await localTodoService.toggleTodo(id);
      }

      if (success) {
        setTodos(prevTodos => {
          return prevTodos.map(todo => {
            if (todo.id === id) {
              const updatedTodo = { ...todo, completed: !todo.completed };
              
              // Update stats using the todo from the previous state
              setStats(prevStats => ({
                ...prevStats,
                completed: todo.completed ? prevStats.completed - 1 : prevStats.completed + 1,
                incomplete: todo.completed ? prevStats.incomplete + 1 : prevStats.incomplete - 1,
                completionRate: Math.round(((todo.completed ? prevStats.completed - 1 : prevStats.completed + 1) / prevStats.total) * 100),
              }));
              
              return updatedTodo;
            }
            return todo;
          });
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일 완료 상태 변경 중 오류가 발생했습니다');
    }
  }, [isAuthenticated]);

  const updateTodo = useCallback(async (id: string, updates: Partial<Pick<TodoItem, 'title' | 'completed' | 'date' | 'category' | 'todoType'>>) => {
    try {
      let success = false;
      
      if (isAuthenticated) {
        // 인증된 사용자: API를 통해 업데이트
        const todoService = TodoService.getInstance();
        success = await todoService.updateTodo(id, updates);
      } else {
        // 미인증 사용자: 로컬 스토리지에서 업데이트
        const localTodoService = LocalTodoService.getInstance();
        success = await localTodoService.updateTodo(id, updates);
      }

      if (success) {
        setTodos(prevTodos => {
          return prevTodos.map(todo => {
            if (todo.id === id) {
              return { ...todo, ...updates };
            }
            return todo;
          });
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일 업데이트 중 오류가 발생했습니다');
    }
  }, [isAuthenticated]);

  const deleteTodo = useCallback(async (id: string) => {
    try {
      let success = false;
      
      if (isAuthenticated) {
        // 인증된 사용자: API를 통해 삭제
        const todoService = TodoService.getInstance();
        success = await todoService.deleteTodo(id);
      } else {
        // 미인증 사용자: 로컬 스토리지에서 삭제
        const localTodoService = LocalTodoService.getInstance();
        success = await localTodoService.deleteTodo(id);
      }

      if (success) {
        setTodos(prevTodos => {
          const todoToDelete = prevTodos.find(t => t.id === id);
          
          // Update stats using the todo from the previous state
          if (todoToDelete) {
            setStats(prevStats => ({
              ...prevStats,
              total: prevStats.total - 1,
              completed: todoToDelete.completed ? prevStats.completed - 1 : prevStats.completed,
              incomplete: todoToDelete.completed ? prevStats.incomplete : prevStats.incomplete - 1,
              completionRate: prevStats.total > 1 ? Math.round((prevStats.completed / (prevStats.total - 1)) * 100) : 0,
            }));
          }
          
          return prevTodos.filter(todo => todo.id !== id);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일 삭제 중 오류가 발생했습니다');
    }
  }, [isAuthenticated]);

  const clearAllTodos = useCallback(async () => {
    try {
      let success = false;
      
      if (isAuthenticated) {
        // 인증된 사용자: API를 통해 전체 삭제
        const todoService = TodoService.getInstance();
        success = await todoService.clearAllTodos();
      } else {
        // 미인증 사용자: 로컬 스토리지에서 전체 삭제
        const localTodoService = LocalTodoService.getInstance();
        success = await localTodoService.clearAllTodos();
      }

      if (success) {
        setTodos([]);
        setStats({
          total: 0,
          completed: 0,
          incomplete: 0,
          completionRate: 0,
          recentCompletions: 0,
          byType: {
            event: { total: 0, completed: 0, incomplete: 0 },
            task: { total: 0, completed: 0, incomplete: 0 }
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '모든 할일 삭제 중 오류가 발생했습니다');
    }
  }, [isAuthenticated]);

  const getTodosByDate = useCallback((date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return todos.filter(
      (todo) => format(todo.date, 'yyyy-MM-dd') === dateString
    );
  }, [todos]);

  const getTodoStats = useCallback((): TodoStats => {
    return stats;
  }, [stats]);

  return {
    todos,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    clearAllTodos,
    getTodosByDate,
    getTodoStats,
    isLoading,
    error,
    refetch: loadTodos,
  };
};
