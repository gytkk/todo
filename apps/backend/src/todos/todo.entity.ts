import { v4 as uuidv4 } from 'uuid';
import { TodoItem, TodoCategory } from '@calendar-todo/shared-types';

export class TodoEntity {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: TodoCategory;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;

  constructor(data: Partial<TodoEntity>) {
    this.id = data.id || uuidv4();
    this.title = data.title || '';
    this.description = data.description;
    this.completed = data.completed || false;
    this.priority = data.priority || 'medium';
    this.category = data.category || {
      id: 'default',
      name: '일반',
      color: '#3B82F6',
      isDefault: true,
      createdAt: new Date(),
    };
    this.dueDate = data.dueDate || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.userId = data.userId || '';
  }

  // Convert to TodoItem for frontend
  toTodoItem(): TodoItem {
    return {
      id: this.id,
      title: this.title,
      date: this.dueDate,
      completed: this.completed,
      category: this.category,
      userId: this.userId,
    };
  }

  // Update entity data
  update(data: Partial<TodoEntity>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.category !== undefined) this.category = data.category;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    
    this.updatedAt = new Date();
  }

  // Toggle completion status
  toggleComplete(): void {
    this.completed = !this.completed;
    this.updatedAt = new Date();
  }
}