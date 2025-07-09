import { Injectable } from '@nestjs/common';
import { TodoEntity } from './todo.entity';
import { TodoCategory } from '@calendar-todo/shared-types';

@Injectable()
export class TodoRepository {
  private todos: TodoEntity[] = [];

  async findAll(): Promise<TodoEntity[]> {
    return this.todos;
  }

  async findById(id: string): Promise<TodoEntity | null> {
    return this.todos.find((todo) => todo.id === id) || null;
  }

  async findByUserId(userId: string): Promise<TodoEntity[]> {
    return this.todos.filter((todo) => todo.userId === userId);
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TodoEntity[]> {
    return this.todos.filter(
      (todo) =>
        todo.userId === userId &&
        todo.dueDate >= startDate &&
        todo.dueDate <= endDate,
    );
  }

  async findByUserIdAndCategory(
    userId: string,
    categoryId: string,
  ): Promise<TodoEntity[]> {
    return this.todos.filter(
      (todo) => todo.userId === userId && todo.category.id === categoryId,
    );
  }

  async findByUserIdAndCompleted(
    userId: string,
    completed: boolean,
  ): Promise<TodoEntity[]> {
    return this.todos.filter(
      (todo) => todo.userId === userId && todo.completed === completed,
    );
  }

  async create(todoData: Partial<TodoEntity>): Promise<TodoEntity> {
    const todo = new TodoEntity(todoData);
    this.todos.push(todo);
    return todo;
  }

  async update(id: string, updateData: Partial<TodoEntity>): Promise<TodoEntity | null> {
    const todoIndex = this.todos.findIndex((todo) => todo.id === id);
    if (todoIndex === -1) {
      return null;
    }

    this.todos[todoIndex].update(updateData);
    return this.todos[todoIndex];
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.todos.length;
    this.todos = this.todos.filter((todo) => todo.id !== id);
    return this.todos.length < initialLength;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const initialLength = this.todos.length;
    this.todos = this.todos.filter((todo) => todo.userId !== userId);
    return initialLength - this.todos.length;
  }

  async toggle(id: string): Promise<TodoEntity | null> {
    const todo = this.todos.find((todo) => todo.id === id);
    if (!todo) {
      return null;
    }

    todo.toggleComplete();
    return todo;
  }

  async updateCategoryForUser(
    userId: string,
    oldCategory: TodoCategory,
    newCategory: TodoCategory,
  ): Promise<number> {
    let updatedCount = 0;
    this.todos.forEach((todo) => {
      if (todo.userId === userId && todo.category.id === oldCategory.id) {
        todo.category = newCategory;
        todo.updatedAt = new Date();
        updatedCount++;
      }
    });
    return updatedCount;
  }

  async count(): Promise<number> {
    return this.todos.length;
  }

  async countByUserId(userId: string): Promise<number> {
    return this.todos.filter((todo) => todo.userId === userId).length;
  }

  async countByUserIdAndCompleted(userId: string, completed: boolean): Promise<number> {
    return this.todos.filter(
      (todo) => todo.userId === userId && todo.completed === completed,
    ).length;
  }
}