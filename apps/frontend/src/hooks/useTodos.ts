import { useCallback, useMemo } from 'react';
import { TodoItem, SavedTodoItem, TodoStats, TodoCategory } from '@calendar-todo/shared-types';
import { useLocalStorage } from './useLocalStorage';
import { format } from 'date-fns';
import { DEFAULT_CATEGORIES } from '@/constants/categories';

export const useTodos = (categories: TodoCategory[] = DEFAULT_CATEGORIES) => {
  const [storedTodos, setStoredTodos] = useLocalStorage<SavedTodoItem[]>('calendar-todos', []);
  
  // Convert stored todos to proper TodoItem objects with Date objects
  const todos: TodoItem[] = useMemo(() => {
    return storedTodos.map((todo: SavedTodoItem) => {
      const todoDate = new Date(todo.date);
      // Validate date
      if (isNaN(todoDate.getTime())) {
        console.warn('Invalid date found in todo:', todo);
        return {
          ...todo,
          date: new Date(), // Fallback to current date
          category: todo.category || categories.find(c => c.id === 'personal') || DEFAULT_CATEGORIES[2], // Default to "개인" category
        };
      }
      return {
        ...todo,
        date: todoDate,
        category: todo.category || categories.find(c => c.id === 'personal') || DEFAULT_CATEGORIES[2], // Default to "개인" category
      };
    });
  }, [storedTodos, categories]);

  const addTodo = useCallback((title: string, date: Date, categoryId: string) => {
    if (title.trim() && date && categoryId) {
      // Find category by ID
      const category = categories.find(cat => cat.id === categoryId) || categories.find(cat => cat.id === 'personal') || DEFAULT_CATEGORIES[2];
      
      const newSavedTodo: SavedTodoItem = {
        id: Date.now().toString(),
        title: title.trim(),
        date: date.toISOString(),
        completed: false,
        category: category,
      };
      setStoredTodos(prevTodos => [...prevTodos, newSavedTodo]);
    }
  }, [setStoredTodos, categories]);

  const toggleTodo = useCallback((id: string) => {
    setStoredTodos(prevTodos =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, [setStoredTodos]);

  const deleteTodo = useCallback((id: string) => {
    setStoredTodos(prevTodos => prevTodos.filter((todo) => todo.id !== id));
  }, [setStoredTodos]);

  const clearAllTodos = useCallback(() => {
    setStoredTodos([]);
  }, [setStoredTodos]);

  const getTodosByDate = useCallback((date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return todos.filter(
      (todo) => format(todo.date, 'yyyy-MM-dd') === dateString
    );
  }, [todos]);

  const getTodoStats = useCallback((): TodoStats => {
    const completed = todos.filter(t => t.completed).length;
    const total = todos.length;
    const incomplete = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCompletions = todos.filter(
      t => t.completed && new Date(t.date) >= sevenDaysAgo
    ).length;

    return {
      total,
      completed,
      incomplete,
      completionRate,
      recentCompletions,
    };
  }, [todos]);

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearAllTodos,
    getTodosByDate,
    getTodoStats,
  };
};