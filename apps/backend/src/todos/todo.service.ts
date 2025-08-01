import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { TodoRepository } from "./todo.repository";
import { TodoEntity } from "./todo.entity";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";
import { TodoCategoryDto } from "./dto/todo-category.dto";
import { TodoItem, TodoStats, TodoCategory } from "@calendar-todo/shared-types";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { subDays } from "date-fns";

@Injectable()
export class TodoService {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly userSettingsService: UserSettingsService,
  ) {}

  private convertCategoryDtoToCategory(
    categoryDto: TodoCategoryDto,
  ): TodoCategory {
    return {
      id: categoryDto.id,
      name: categoryDto.name,
      color: categoryDto.color,
      icon: categoryDto.icon,
      createdAt: new Date(categoryDto.createdAt),
      order: categoryDto.order,
    };
  }

  async create(
    createTodoDto: CreateTodoDto,
    userId: string,
  ): Promise<TodoItem> {
    const category = this.convertCategoryDtoToCategory(createTodoDto.category);

    // Verify category belongs to user
    const userCategory = await this.userSettingsService.getCategoryById(
      userId,
      category.id,
    );
    if (!userCategory) {
      throw new NotFoundException(
        "Category not found or does not belong to user",
      );
    }

    const todoData = {
      title: createTodoDto.title,
      description: createTodoDto.description,
      priority: createTodoDto.priority || "medium",
      categoryId: category.id,
      todoType: createTodoDto.todoType || "event", // 기본값을 'event'로 설정
      dueDate: new Date(createTodoDto.date),
      userId,
    };

    const todo = await this.todoRepository.create(todoData);
    return todo.toTodoItem(userCategory);
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

    // Get user categories to resolve category information
    const userCategories =
      await this.userSettingsService.getUserCategories(userId);
    const categoryMap = new Map(userCategories.map((cat) => [cat.id, cat]));

    return todos.map((todo) => {
      const category = categoryMap.get(todo.categoryId);
      return todo.toTodoItem(category);
    });
  }

  async findOne(id: string, userId: string): Promise<TodoItem> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundException("할일을 찾을 수 없습니다");
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException("해당 할일에 접근할 권한이 없습니다");
    }

    const category = await this.userSettingsService.getCategoryById(
      userId,
      todo.categoryId,
    );
    return todo.toTodoItem(category || undefined);
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
    if (updateTodoDto.category !== undefined) {
      const category = this.convertCategoryDtoToCategory(
        updateTodoDto.category,
      );

      // Verify category belongs to user
      const userCategory = await this.userSettingsService.getCategoryById(
        userId,
        category.id,
      );
      if (!userCategory) {
        throw new NotFoundException(
          "Category not found or does not belong to user",
        );
      }

      updateData.categoryId = category.id;
    }
    if (updateTodoDto.date !== undefined)
      updateData.dueDate = new Date(updateTodoDto.date);
    if (updateTodoDto.todoType !== undefined)
      updateData.todoType = updateTodoDto.todoType;

    const updatedTodo = await this.todoRepository.update(id, updateData);
    const category = await this.userSettingsService.getCategoryById(
      userId,
      updatedTodo!.categoryId,
    );
    return updatedTodo!.toTodoItem(category || undefined);
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
    const category = await this.userSettingsService.getCategoryById(
      userId,
      updatedTodo!.categoryId,
    );
    return updatedTodo!.toTodoItem(category || undefined);
  }

  async getStats(userId: string): Promise<TodoStats> {
    // Use efficient Redis counters instead of loading all todos
    const stats = await this.todoRepository.getStatsForUser(userId);

    // For recent completions, query only completed todos and filter by date
    // This is more efficient than loading all todos
    const sevenDaysAgo = subDays(new Date(), 7);
    const completedTodos = await this.todoRepository.findByUserIdAndCompleted(
      userId,
      true,
    );
    const recentCompletions = completedTodos.filter(
      (todo) => todo.updatedAt >= sevenDaysAgo,
    ).length;

    const completionRate =
      stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    // Get all todos to calculate type-based statistics
    const allTodos = await this.todoRepository.findByUserId(userId);

    // Calculate statistics by todo type
    const eventTodos = allTodos.filter((todo) => todo.todoType === "event");
    const taskTodos = allTodos.filter((todo) => todo.todoType === "task");

    const eventStats = {
      total: eventTodos.length,
      completed: eventTodos.filter((todo) => todo.completed).length,
      incomplete: eventTodos.filter((todo) => !todo.completed).length,
    };

    const taskStats = {
      total: taskTodos.length,
      completed: taskTodos.filter((todo) => todo.completed).length,
      incomplete: taskTodos.filter((todo) => !todo.completed).length,
    };

    return {
      total: stats.total,
      completed: stats.completed,
      incomplete: stats.incomplete,
      completionRate,
      recentCompletions,
      byType: {
        event: eventStats,
        task: taskStats,
      },
    };
  }

  async removeAllByUserId(userId: string): Promise<number> {
    const todos = await this.todoRepository.findByUserId(userId);
    await this.todoRepository.deleteByUserId(userId);
    return todos.length;
  }

  async updateCategoryForUser(
    userId: string,
    oldCategoryId: string,
    newCategoryId: string,
  ): Promise<number> {
    return await this.todoRepository.updateCategoryForUser(
      userId,
      oldCategoryId,
      newCategoryId,
    );
  }

  async bulkCreate(
    todos: Omit<TodoItem, "id">[],
    userId: string,
  ): Promise<TodoItem[]> {
    const createdTodos: TodoItem[] = [];

    for (const todoData of todos) {
      const categoryDto: TodoCategoryDto = {
        id: todoData.category.id,
        name: todoData.category.name,
        color: todoData.category.color,
        icon: todoData.category.icon,
        createdAt: todoData.category.createdAt.toISOString(),
        order: todoData.category.order,
      };

      const createDto: CreateTodoDto = {
        title: todoData.title,
        category: categoryDto,
        date: todoData.date.toISOString(),
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

  /**
   * 오늘 이전 날짜의 미완료 작업들을 오늘로 이동
   */
  async moveTasksToNextDay(
    userId: string,
  ): Promise<{ movedCount: number; movedTaskIds: string[] }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 이동이 필요한 작업들 조회
    const tasksToMove = await this.getTasksDueForMove(userId);

    if (tasksToMove.length === 0) {
      return { movedCount: 0, movedTaskIds: [] };
    }

    let movedCount = 0;
    const movedTaskIds: string[] = [];

    // 각 작업을 오늘로 이동
    for (const task of tasksToMove) {
      try {
        await this.todoRepository.update(task.id, {
          dueDate: today,
          updatedAt: new Date(),
        });
        movedCount++;
        movedTaskIds.push(task.id);
      } catch (error) {
        console.error(`작업 ${task.id} 이동 실패:`, error);
      }
    }

    return { movedCount, movedTaskIds };
  }

  /**
   * 이동이 필요한 작업들 조회
   */
  async getTasksDueForMove(userId: string): Promise<TodoEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 사용자의 모든 할 일 조회
    const allTodos = await this.todoRepository.findByUserId(userId);

    // 이동 조건에 맞는 작업들 필터링
    return allTodos.filter((todo) => {
      return (
        todo.todoType === "task" && // 작업 타입
        !todo.completed && // 미완료
        todo.dueDate < today // 오늘 이전 날짜
      );
    });
  }

  /**
   * 특정 사용자의 이동 대상 작업 개수 조회
   */
  async getTasksMoveCount(userId: string): Promise<number> {
    const tasksToMove = await this.getTasksDueForMove(userId);
    return tasksToMove.length;
  }
}
