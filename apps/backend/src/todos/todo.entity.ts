import { v4 as uuidv4 } from "uuid";
import { TodoItem, TodoCategory, TodoType } from "@calendar-todo/shared-types";

export class TodoEntity {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  categoryId: string;
  todoType: TodoType;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;

  constructor(data: Partial<TodoEntity>) {
    this.id = data.id || uuidv4();
    this.title = data.title || "";
    this.description = data.description;
    this.completed = data.completed || false;
    this.priority = data.priority || "medium";
    this.categoryId = data.categoryId || "personal";
    this.todoType = data.todoType || "event"; // 기본값을 'event'로 설정
    this.dueDate = data.dueDate || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.userId = data.userId || "";
  }

  // Convert to TodoItem for frontend (category will be resolved by service)
  toTodoItem(category?: TodoCategory): TodoItem {
    return {
      id: this.id,
      title: this.title,
      date: this.dueDate,
      completed: this.completed,
      category: category || {
        id: this.categoryId,
        name: "Unknown",
        color: "#64748b",
        createdAt: new Date(),
        order: 0,
      },
      todoType: this.todoType,
      userId: this.userId,
    };
  }

  // Update entity data
  update(data: Partial<TodoEntity>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.categoryId !== undefined) this.categoryId = data.categoryId;
    if (data.todoType !== undefined) this.todoType = data.todoType;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;

    this.updatedAt = new Date();
  }

  // Toggle completion status
  toggleComplete(): void {
    this.completed = !this.completed;
    this.updatedAt = new Date();
  }
}
