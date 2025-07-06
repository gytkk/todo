import { TodoItem, SavedTodoItem } from '@/types';
import { safeLocalStorageGet, safeLocalStorageSet } from '@/utils/errorHandler';

export class TodoService {
  private static instance: TodoService;
  private readonly STORAGE_KEY = 'calendar-todos';

  static getInstance(): TodoService {
    if (!TodoService.instance) {
      TodoService.instance = new TodoService();
    }
    return TodoService.instance;
  }

  async getTodos(): Promise<TodoItem[]> {
    try {
      const savedTodos = safeLocalStorageGet(this.STORAGE_KEY, []);
      
      if (Array.isArray(savedTodos)) {
        return savedTodos.map((todo: SavedTodoItem) => ({
          ...todo,
          date: new Date(todo.date),
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error loading todos:', error);
      return [];
    }
  }

  async saveTodos(todos: TodoItem[]): Promise<boolean> {
    try {
      const serializedTodos = todos.map(todo => ({
        ...todo,
        date: todo.date.toISOString(),
      }));
      
      return safeLocalStorageSet(this.STORAGE_KEY, serializedTodos);
    } catch (error) {
      console.error('Error saving todos:', error);
      return false;
    }
  }

  async addTodo(todo: Omit<TodoItem, 'id'>): Promise<TodoItem | null> {
    try {
      const currentTodos = await this.getTodos();
      const newTodo: TodoItem = {
        ...todo,
        id: Date.now().toString(),
      };
      
      const updatedTodos = [...currentTodos, newTodo];
      const success = await this.saveTodos(updatedTodos);
      
      return success ? newTodo : null;
    } catch (error) {
      console.error('Error adding todo:', error);
      return null;
    }
  }

  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<boolean> {
    try {
      const currentTodos = await this.getTodos();
      const updatedTodos = currentTodos.map(todo =>
        todo.id === id ? { ...todo, ...updates } : todo
      );
      
      return await this.saveTodos(updatedTodos);
    } catch (error) {
      console.error('Error updating todo:', error);
      return false;
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      const currentTodos = await this.getTodos();
      const filteredTodos = currentTodos.filter(todo => todo.id !== id);
      
      return await this.saveTodos(filteredTodos);
    } catch (error) {
      console.error('Error deleting todo:', error);
      return false;
    }
  }

  async clearAllTodos(): Promise<boolean> {
    try {
      return safeLocalStorageSet(this.STORAGE_KEY, []);
    } catch (error) {
      console.error('Error clearing todos:', error);
      return false;
    }
  }

  async exportTodos(): Promise<Blob> {
    try {
      const todos = await this.getTodos();
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
          
          // Validate and convert dates
          const validatedTodos: TodoItem[] = importedData.map((item, index) => {
            if (!item.id || !item.title || !item.date) {
              throw new Error(`Invalid todo item at index ${index}`);
            }
            
            return {
              id: item.id,
              title: item.title,
              date: new Date(item.date),
              completed: Boolean(item.completed),
            };
          });
          
          const success = await this.saveTodos(validatedTodos);
          if (!success) {
            throw new Error('Failed to save imported todos');
          }
          
          resolve(validatedTodos);
        } catch (error) {
          reject(new Error('Failed to import todos: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}