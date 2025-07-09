import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { TodoRepository } from "./todo.repository";
import { TodoEntity } from "./todo.entity";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";
import { TodoItem, TodoStats, TodoCategory } from "@calendar-todo/shared-types";
import { subDays, startOfDay, endOfDay } from "date-fns";

@Injectable()
export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}

  async create(
    createTodoDto: CreateTodoDto,
    userId: string,
  ): Promise<TodoItem> {
    const todoData = {
      title: createTodoDto.title,
      description: createTodoDto.description,
      priority: createTodoDto.priority || "medium",
      category: createTodoDto.category,
      dueDate: new Date(createTodoDto.dueDate),
      userId,
    };

    const todo = await this.todoRepository.create(todoData);
    return todo.toTodoItem();
  }

  async findAll(
    userId: string,
    startDate?: string,
    endDate?: string,
    categoryId?: string,
    completed?: boolean,
  ): Promise<TodoItem[]> {
    let todos: TodoEntity[];

    if (startDate && endDate) {
      todos = await this.todoRepository.findByUserIdAndDateRange(
        userId,
        new Date(startDate),
        new Date(endDate),
      );
    } else if (categoryId) {
      todos = await this.todoRepository.findByUserIdAndCategory(
        userId,
        categoryId,
      );
    } else if (completed !== undefined) {
      todos = await this.todoRepository.findByUserIdAndCompleted(
        userId,
        completed,
      );
    } else {
      todos = await this.todoRepository.findByUserId(userId);
    }

    return todos.map((todo) => todo.toTodoItem());
  }

  async findOne(id: string, userId: string): Promise<TodoItem> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundException("할일을 찾을 수 없습니다");
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException("해당 할일에 접근할 권한이 없습니다");
    }

    return todo.toTodoItem();
  }

  async update(
    id: string,
    updateTodoDto: UpdateTodoDto,
    userId: string,
  ): Promise<TodoItem> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundException("할일을 찾을 수 없습니다");
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException("해당 할일을 수정할 권한이 없습니다");
    }

    const updateData: Partial<TodoEntity> = {};

    if (updateTodoDto.title !== undefined)
      updateData.title = updateTodoDto.title;
    if (updateTodoDto.description !== undefined)
      updateData.description = updateTodoDto.description;
    if (updateTodoDto.completed !== undefined)
      updateData.completed = updateTodoDto.completed;
    if (updateTodoDto.priority !== undefined)
      updateData.priority = updateTodoDto.priority;
    if (updateTodoDto.category !== undefined)
      updateData.category = updateTodoDto.category;
    if (updateTodoDto.dueDate !== undefined)
      updateData.dueDate = new Date(updateTodoDto.dueDate);

    const updatedTodo = await this.todoRepository.update(id, updateData);
    return updatedTodo!.toTodoItem();
  }

  async remove(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; deletedId: string }> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundException("할일을 찾을 수 없습니다");
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException("해당 할일을 삭제할 권한이 없습니다");
    }

    const success = await this.todoRepository.delete(id);
    return { success, deletedId: id };
  }

  async toggle(id: string, userId: string): Promise<TodoItem> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundException("할일을 찾을 수 없습니다");
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException("해당 할일을 수정할 권한이 없습니다");
    }

    const updatedTodo = await this.todoRepository.toggle(id);
    return updatedTodo!.toTodoItem();
  }

  async getStats(userId: string): Promise<TodoStats> {
    const allTodos = await this.todoRepository.findByUserId(userId);
    const completedTodos = allTodos.filter((todo) => todo.completed);
    const incompleteTodos = allTodos.filter((todo) => !todo.completed);

    // 최근 7일 내 완료된 할일 수
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentCompletions = completedTodos.filter(
      (todo) => todo.updatedAt >= sevenDaysAgo && todo.completed,
    ).length;

    const total = allTodos.length;
    const completed = completedTodos.length;
    const incomplete = incompleteTodos.length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      incomplete,
      completionRate,
      recentCompletions,
    };
  }

  async removeAllByUserId(userId: string): Promise<number> {
    return await this.todoRepository.deleteByUserId(userId);
  }

  async updateCategoryForUser(
    userId: string,
    oldCategory: TodoCategory,
    newCategory: TodoCategory,
  ): Promise<number> {
    return await this.todoRepository.updateCategoryForUser(
      userId,
      oldCategory,
      newCategory,
    );
  }

  async bulkCreate(
    todos: Omit<TodoItem, "id">[],
    userId: string,
  ): Promise<TodoItem[]> {
    const createdTodos: TodoItem[] = [];

    for (const todoData of todos) {
      const createDto: CreateTodoDto = {
        title: todoData.title,
        category: todoData.category,
        dueDate: todoData.date.toISOString(),
        priority: "medium",
      };

      const todo = await this.create(createDto, userId);
      if (todoData.completed) {
        await this.update(todo.id, { completed: true }, userId);
      }
      createdTodos.push(todo);
    }

    return createdTodos;
  }
}
