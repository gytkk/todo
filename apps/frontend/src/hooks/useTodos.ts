import { useCallback, useMemo, useState, useEffect } from 'react';
import { TodoItem, TodoStats, TodoCategory } from '@calendar-todo/shared-types';
import { format } from 'date-fns';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { TodoService } from '@/services/todoService';
import { useAuth } from '@/contexts/AuthContext';

export const useTodos = (categories: TodoCategory[] = DEFAULT_CATEGORIES) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [stats, setStats] = useState<TodoStats>({
    total: 0,
    completed: 0,
    incomplete: 0,
    completionRate: 0,
    recentCompletions: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const todoService = useMemo(() => TodoService.getInstance(), []);

  // Load todos from API
  const loadTodos = useCallback(async () => {
    if (!isAuthenticated) {
      setTodos([]);
      setStats({
        total: 0,
        completed: 0,
        incomplete: 0,
        completionRate: 0,
        recentCompletions: 0,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { todos: apiTodos, stats: apiStats } = await todoService.getTodos();
      setTodos(apiTodos);
      setStats(apiStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일을 불러오는 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [todoService, isAuthenticated]);

  // Load todos when authentication state changes
  useEffect(() => {
    if (!authLoading) {
      loadTodos();
    }
  }, [loadTodos, authLoading]);

  const addTodo = useCallback(async (title: string, date: Date, categoryId: string) => {
    if (!title.trim() || !date || !categoryId || !isAuthenticated) return;

    const category = categories.find(cat => cat.id === categoryId) || 
                   categories.find(cat => cat.id === 'personal') || 
                   DEFAULT_CATEGORIES[2];

    const newTodo: Omit<TodoItem, 'id'> = {
      title: title.trim(),
      date,
      completed: false,
      category,
    };

    try {
      const createdTodo = await todoService.addTodo(newTodo);
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
  }, [todoService, categories, isAuthenticated]);

  const toggleTodo = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    
    try {
      const success = await todoService.toggleTodo(id);
      if (success) {
        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          )
        );
        
        // Update stats
        const todo = todos.find(t => t.id === id);
        if (todo) {
          setStats(prevStats => ({
            ...prevStats,
            completed: todo.completed ? prevStats.completed - 1 : prevStats.completed + 1,
            incomplete: todo.completed ? prevStats.incomplete + 1 : prevStats.incomplete - 1,
            completionRate: Math.round(((todo.completed ? prevStats.completed - 1 : prevStats.completed + 1) / prevStats.total) * 100),
          }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일 완료 상태 변경 중 오류가 발생했습니다');
    }
  }, [todoService, todos, isAuthenticated]);

  const deleteTodo = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    
    try {
      const success = await todoService.deleteTodo(id);
      if (success) {
        const todoToDelete = todos.find(t => t.id === id);
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
        
        // Update stats
        if (todoToDelete) {
          setStats(prevStats => ({
            ...prevStats,
            total: prevStats.total - 1,
            completed: todoToDelete.completed ? prevStats.completed - 1 : prevStats.completed,
            incomplete: todoToDelete.completed ? prevStats.incomplete : prevStats.incomplete - 1,
            completionRate: prevStats.total > 1 ? Math.round((prevStats.completed / (prevStats.total - 1)) * 100) : 0,
          }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일 삭제 중 오류가 발생했습니다');
    }
  }, [todoService, todos, isAuthenticated]);

  const clearAllTodos = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const success = await todoService.clearAllTodos();
      if (success) {
        setTodos([]);
        setStats({
          total: 0,
          completed: 0,
          incomplete: 0,
          completionRate: 0,
          recentCompletions: 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '모든 할일 삭제 중 오류가 발생했습니다');
    }
  }, [todoService, isAuthenticated]);

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
