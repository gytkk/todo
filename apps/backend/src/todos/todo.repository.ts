import { Injectable } from "@nestjs/common";
import { TodoEntity } from "./todo.entity";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class TodoRepository {
  constructor(private readonly redisService: RedisService) {}

  async findAll(): Promise<TodoEntity[]> {
    const todoIds = await this.redisService.keys("todo:todo:*");
    const todos: TodoEntity[] = [];

    for (const todoKey of todoIds) {
      const todoId = todoKey.split(":")[2];
      const todo = await this.findById(todoId);
      if (todo) {
        todos.push(todo);
      }
    }

    return todos;
  }

  async findById(id: string): Promise<TodoEntity | null> {
    const todoKey = this.redisService.generateKey("todo", id);
    const todoData = await this.redisService.hgetall(todoKey);

    if (!todoData || Object.keys(todoData).length === 0) {
      return null;
    }

    return new TodoEntity({
      id: todoData.id,
      title: todoData.title,
      description: todoData.description,
      completed: todoData.completed === "true",
      priority: todoData.priority as "high" | "medium" | "low",
      categoryId: todoData.categoryId || "default",
      dueDate: new Date(todoData.dueDate),
      createdAt: new Date(todoData.createdAt),
      updatedAt: new Date(todoData.updatedAt),
      userId: todoData.userId,
    });
  }

  async findByUserId(userId: string): Promise<TodoEntity[]> {
    const userTodosKey = this.redisService.generateKey("user", userId, "todos");
    const todoIds = await this.redisService.zrange(userTodosKey, 0, -1);

    const todos: TodoEntity[] = [];
    for (const todoId of todoIds) {
      const todo = await this.findById(todoId);
      if (todo) {
        todos.push(todo);
      }
    }

    return todos;
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TodoEntity[]> {
    const userTodosByDateKey = this.redisService.generateKey(
      "user",
      userId,
      "todos",
      "bydate",
    );
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const todoIds = await this.redisService.zrangebyscore(
      userTodosByDateKey,
      startTimestamp,
      endTimestamp,
    );

    const todos: TodoEntity[] = [];
    for (const todoId of todoIds) {
      const todo = await this.findById(todoId);
      if (todo) {
        todos.push(todo);
      }
    }

    return todos;
  }

  async findByUserIdAndCategory(
    userId: string,
    categoryId: string,
  ): Promise<TodoEntity[]> {
    const userCategoryKey = this.redisService.generateKey(
      "user",
      userId,
      "category",
      categoryId,
    );
    const todoIds = await this.redisService.zrange(userCategoryKey, 0, -1);

    const todos: TodoEntity[] = [];
    for (const todoId of todoIds) {
      const todo = await this.findById(todoId);
      if (todo) {
        todos.push(todo);
      }
    }

    return todos;
  }

  async findByUserIdAndCompleted(
    userId: string,
    completed: boolean,
  ): Promise<TodoEntity[]> {
    const userCompletedKey = this.redisService.generateKey(
      "user",
      userId,
      "completed",
      completed.toString(),
    );
    const todoIds = await this.redisService.zrange(userCompletedKey, 0, -1);

    const todos: TodoEntity[] = [];
    for (const todoId of todoIds) {
      const todo = await this.findById(todoId);
      if (todo) {
        todos.push(todo);
      }
    }

    return todos;
  }

  async create(todoData: Partial<TodoEntity>): Promise<TodoEntity> {
    const todo = new TodoEntity(todoData);
    const todoKey = this.redisService.generateKey("todo", todo.id);
    const userTodosKey = this.redisService.generateKey(
      "user",
      todo.userId,
      "todos",
    );
    const userTodosByDateKey = this.redisService.generateKey(
      "user",
      todo.userId,
      "todos",
      "bydate",
    );
    const userCategoryKey = this.redisService.generateKey(
      "user",
      todo.userId,
      "category",
      todo.categoryId,
    );
    const userCompletedKey = this.redisService.generateKey(
      "user",
      todo.userId,
      "completed",
      todo.completed.toString(),
    );

    const todoHashData = {
      id: todo.id,
      title: todo.title,
      description: todo.description || "",
      completed: todo.completed.toString(),
      priority: todo.priority,
      categoryId: todo.categoryId,
      dueDate: todo.dueDate.toISOString(),
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
      userId: todo.userId,
    };

    await this.redisService.hmset(todoKey, todoHashData);
    await this.redisService.zadd(
      userTodosKey,
      todo.createdAt.getTime(),
      todo.id,
    );
    await this.redisService.zadd(
      userTodosByDateKey,
      Math.floor(todo.dueDate.getTime() / 1000),
      todo.id,
    );
    await this.redisService.zadd(
      userCategoryKey,
      todo.createdAt.getTime(),
      todo.id,
    );
    await this.redisService.zadd(
      userCompletedKey,
      todo.createdAt.getTime(),
      todo.id,
    );

    return todo;
  }

  async update(
    id: string,
    updateData: Partial<TodoEntity>,
  ): Promise<TodoEntity | null> {
    const existingTodo = await this.findById(id);
    if (!existingTodo) {
      return null;
    }

    const oldCompleted = existingTodo.completed;
    const oldCategoryId = existingTodo.categoryId;

    existingTodo.update(updateData);

    const todoKey = this.redisService.generateKey("todo", id);
    const todoHashData = {
      id: existingTodo.id,
      title: existingTodo.title,
      description: existingTodo.description || "",
      completed: existingTodo.completed.toString(),
      priority: existingTodo.priority,
      categoryId: existingTodo.categoryId,
      dueDate: existingTodo.dueDate.toISOString(),
      createdAt: existingTodo.createdAt.toISOString(),
      updatedAt: existingTodo.updatedAt.toISOString(),
      userId: existingTodo.userId,
    };

    await this.redisService.hmset(todoKey, todoHashData);

    // Update indices if completion status changed
    if (oldCompleted !== existingTodo.completed) {
      const oldCompletedKey = this.redisService.generateKey(
        "user",
        existingTodo.userId,
        "completed",
        oldCompleted.toString(),
      );
      const newCompletedKey = this.redisService.generateKey(
        "user",
        existingTodo.userId,
        "completed",
        existingTodo.completed.toString(),
      );

      await this.redisService.zrem(oldCompletedKey, id);
      await this.redisService.zadd(
        newCompletedKey,
        existingTodo.createdAt.getTime(),
        id,
      );
    }

    // Update category index if category changed
    if (oldCategoryId !== existingTodo.categoryId) {
      const oldCategoryKey = this.redisService.generateKey(
        "user",
        existingTodo.userId,
        "category",
        oldCategoryId,
      );
      const newCategoryKey = this.redisService.generateKey(
        "user",
        existingTodo.userId,
        "category",
        existingTodo.categoryId,
      );

      await this.redisService.zrem(oldCategoryKey, id);
      await this.redisService.zadd(
        newCategoryKey,
        existingTodo.createdAt.getTime(),
        id,
      );
    }

    return existingTodo;
  }

  async delete(id: string): Promise<boolean> {
    const existingTodo = await this.findById(id);
    if (!existingTodo) {
      return false;
    }

    const todoKey = this.redisService.generateKey("todo", id);
    const userTodosKey = this.redisService.generateKey(
      "user",
      existingTodo.userId,
      "todos",
    );
    const userTodosByDateKey = this.redisService.generateKey(
      "user",
      existingTodo.userId,
      "todos",
      "bydate",
    );
    const userCategoryKey = this.redisService.generateKey(
      "user",
      existingTodo.userId,
      "category",
      existingTodo.categoryId,
    );
    const userCompletedKey = this.redisService.generateKey(
      "user",
      existingTodo.userId,
      "completed",
      existingTodo.completed.toString(),
    );

    await this.redisService.del(todoKey);
    await this.redisService.zrem(userTodosKey, id);
    await this.redisService.zrem(userTodosByDateKey, id);
    await this.redisService.zrem(userCategoryKey, id);
    await this.redisService.zrem(userCompletedKey, id);

    return true;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const userTodos = await this.findByUserId(userId);
    let deletedCount = 0;

    for (const todo of userTodos) {
      const success = await this.delete(todo.id);
      if (success) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async toggle(id: string): Promise<TodoEntity | null> {
    const existingTodo = await this.findById(id);
    if (!existingTodo) {
      return null;
    }

    const oldCompleted = existingTodo.completed;
    existingTodo.toggleComplete();

    const todoKey = this.redisService.generateKey("todo", id);
    const todoHashData = {
      id: existingTodo.id,
      title: existingTodo.title,
      description: existingTodo.description || "",
      completed: existingTodo.completed.toString(),
      priority: existingTodo.priority,
      categoryId: existingTodo.categoryId,
      dueDate: existingTodo.dueDate.toISOString(),
      createdAt: existingTodo.createdAt.toISOString(),
      updatedAt: existingTodo.updatedAt.toISOString(),
      userId: existingTodo.userId,
    };

    await this.redisService.hmset(todoKey, todoHashData);

    // Update completion indices
    const oldCompletedKey = this.redisService.generateKey(
      "user",
      existingTodo.userId,
      "completed",
      oldCompleted.toString(),
    );
    const newCompletedKey = this.redisService.generateKey(
      "user",
      existingTodo.userId,
      "completed",
      existingTodo.completed.toString(),
    );

    await this.redisService.zrem(oldCompletedKey, id);
    await this.redisService.zadd(
      newCompletedKey,
      existingTodo.createdAt.getTime(),
      id,
    );

    return existingTodo;
  }

  async updateCategoryForUser(
    userId: string,
    oldCategoryId: string,
    newCategoryId: string,
  ): Promise<number> {
    const userTodos = await this.findByUserIdAndCategory(userId, oldCategoryId);
    let updatedCount = 0;

    for (const todo of userTodos) {
      const success = await this.update(todo.id, { categoryId: newCategoryId });
      if (success) {
        updatedCount++;
      }
    }

    return updatedCount;
  }

  async count(): Promise<number> {
    const todoKeys = await this.redisService.keys("todo:todo:*");
    return todoKeys.length;
  }

  async countByUserId(userId: string): Promise<number> {
    const userTodosKey = this.redisService.generateKey("user", userId, "todos");
    return await this.redisService.zcard(userTodosKey);
  }

  async countByUserIdAndCompleted(
    userId: string,
    completed: boolean,
  ): Promise<number> {
    const userCompletedKey = this.redisService.generateKey(
      "user",
      userId,
      "completed",
      completed.toString(),
    );
    return await this.redisService.zcard(userCompletedKey);
  }
}
