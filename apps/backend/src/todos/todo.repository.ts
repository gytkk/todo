import { Injectable } from "@nestjs/common";
import { TodoEntity } from "./todo.entity";
import { RedisService } from "../redis/redis.service";
import type { RedisPipeline } from "../common/types/redis.types";
import { UserScopedRedisRepository } from "../common/repositories/user-scoped-redis.repository";

@Injectable()
export class TodoRepository extends UserScopedRedisRepository<TodoEntity> {
  protected entityName = "todo";

  constructor(redisService: RedisService) {
    super(redisService);
  }

  protected serialize(todo: TodoEntity): Record<string, string> {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description || "",
      completed: todo.completed.toString(),
      priority: todo.priority,
      categoryId: todo.categoryId,
      todoType: todo.todoType,
      dueDate: todo.dueDate.toISOString(),
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
      userId: todo.userId,
    };
  }

  protected deserialize(data: Record<string, string>): TodoEntity {
    return new TodoEntity({
      id: data.id,
      title: data.title,
      description: data.description,
      completed: data.completed === "true",
      priority: data.priority as "high" | "medium" | "low",
      categoryId: data.categoryId || "default",
      todoType: (data.todoType as "event" | "task") || "event", // 기본값 'event'로 마이그레이션 처리
      dueDate: new Date(data.dueDate),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      userId: data.userId,
    });
  }

  protected createEntity(data: Partial<TodoEntity>): TodoEntity {
    return new TodoEntity(data);
  }

  protected updateEntity(
    existing: TodoEntity,
    updates: Partial<TodoEntity>,
  ): TodoEntity {
    return new TodoEntity({
      ...existing,
      ...updates,
      updatedAt: new Date(),
    });
  }

  protected updateUserIndexes(
    pipeline: RedisPipeline,
    newTodo: TodoEntity,
    oldTodo: TodoEntity | null,
  ): void {
    const userId = newTodo.userId;

    // 날짜별 인덱스
    const dateKey = this.generateUserIndexKey(
      userId,
      "date",
      newTodo.dueDate.toISOString().split("T")[0],
    );
    pipeline.sadd(dateKey, newTodo.id);

    // 카테고리별 인덱스
    const categoryKey = this.generateUserIndexKey(
      userId,
      "category",
      newTodo.categoryId,
    );
    pipeline.sadd(categoryKey, newTodo.id);

    // 완료 상태별 인덱스
    const completedKey = this.generateUserIndexKey(
      userId,
      "completed",
      newTodo.completed.toString(),
    );
    pipeline.sadd(completedKey, newTodo.id);

    // 우선순위별 인덱스
    const priorityKey = this.generateUserIndexKey(
      userId,
      "priority",
      newTodo.priority,
    );
    pipeline.sadd(priorityKey, newTodo.id);

    // 타입별 인덱스
    const typeKey = this.generateUserIndexKey(userId, "type", newTodo.todoType);
    pipeline.sadd(typeKey, newTodo.id);

    // 기존 인덱스에서 제거 (업데이트인 경우)
    if (oldTodo) {
      if (
        oldTodo.dueDate.toISOString().split("T")[0] !==
        newTodo.dueDate.toISOString().split("T")[0]
      ) {
        const oldDateKey = this.generateUserIndexKey(
          userId,
          "date",
          oldTodo.dueDate.toISOString().split("T")[0],
        );
        pipeline.srem(oldDateKey, newTodo.id);
      }

      if (oldTodo.categoryId !== newTodo.categoryId) {
        const oldCategoryKey = this.generateUserIndexKey(
          userId,
          "category",
          oldTodo.categoryId,
        );
        pipeline.srem(oldCategoryKey, newTodo.id);
      }

      if (oldTodo.completed !== newTodo.completed) {
        const oldCompletedKey = this.generateUserIndexKey(
          userId,
          "completed",
          oldTodo.completed.toString(),
        );
        pipeline.srem(oldCompletedKey, newTodo.id);
      }

      if (oldTodo.priority !== newTodo.priority) {
        const oldPriorityKey = this.generateUserIndexKey(
          userId,
          "priority",
          oldTodo.priority,
        );
        pipeline.srem(oldPriorityKey, newTodo.id);
      }

      if (oldTodo.todoType !== newTodo.todoType) {
        const oldTypeKey = this.generateUserIndexKey(
          userId,
          "type",
          oldTodo.todoType,
        );
        pipeline.srem(oldTypeKey, newTodo.id);
      }
    }
  }

  protected removeUserEntityIndexes(
    pipeline: RedisPipeline,
    todo: TodoEntity,
  ): void {
    const userId = todo.userId;

    // 모든 인덱스에서 제거
    const dateKey = this.generateUserIndexKey(
      userId,
      "date",
      todo.dueDate.toISOString().split("T")[0],
    );
    const categoryKey = this.generateUserIndexKey(
      userId,
      "category",
      todo.categoryId,
    );
    const completedKey = this.generateUserIndexKey(
      userId,
      "completed",
      todo.completed.toString(),
    );
    const priorityKey = this.generateUserIndexKey(
      userId,
      "priority",
      todo.priority,
    );
    const typeKey = this.generateUserIndexKey(userId, "type", todo.todoType);

    pipeline.srem(dateKey, todo.id);
    pipeline.srem(categoryKey, todo.id);
    pipeline.srem(completedKey, todo.id);
    pipeline.srem(priorityKey, todo.id);
    pipeline.srem(typeKey, todo.id);
  }

  protected async removeUserIndexes(
    pipeline: RedisPipeline,
    userId: string,
  ): Promise<void> {
    // 사용자의 모든 인덱스 제거 (패턴 매칭 사용)
    const pattern = this.redisService.generateKey(
      this.entityName,
      "user",
      userId,
      "index",
      "*",
    );
    const keys = await this.redisService.keys(pattern);

    keys.forEach((key) => {
      pipeline.del(key);
    });
  }

  // 특화된 검색 메서드들
  async findByUserIdAndCategory(
    userId: string,
    categoryId: string,
  ): Promise<TodoEntity[]> {
    const categoryKey = this.generateUserIndexKey(
      userId,
      "category",
      categoryId,
    );
    const todoIds = await this.redisService.smembers(categoryKey);

    return this.findByIds(todoIds);
  }

  async findByUserIdAndCompleted(
    userId: string,
    completed: boolean,
  ): Promise<TodoEntity[]> {
    const completedKey = this.generateUserIndexKey(
      userId,
      "completed",
      completed.toString(),
    );
    const todoIds = await this.redisService.smembers(completedKey);

    return this.findByIds(todoIds);
  }

  async findByUserIdAndPriority(
    userId: string,
    priority: string,
  ): Promise<TodoEntity[]> {
    const priorityKey = this.generateUserIndexKey(userId, "priority", priority);
    const todoIds = await this.redisService.smembers(priorityKey);

    return this.findByIds(todoIds);
  }

  async findByUserIdAndDate(userId: string, date: Date): Promise<TodoEntity[]> {
    const dateKey = this.generateUserIndexKey(
      userId,
      "date",
      date.toISOString().split("T")[0],
    );
    const todoIds = await this.redisService.smembers(dateKey);

    return this.findByIds(todoIds);
  }

  async toggle(id: string): Promise<TodoEntity | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    return this.update(id, { completed: !existing.completed });
  }

  async updateCategoryForUser(
    userId: string,
    oldCategoryId: string,
    newCategoryId: string,
  ): Promise<number> {
    const todos = await this.findByUserIdAndCategory(userId, oldCategoryId);
    let updatedCount = 0;

    // Pipeline을 사용하여 배치 업데이트
    const pipeline = this.redisService.pipeline();

    for (const todo of todos) {
      const updated = this.updateEntity(todo, { categoryId: newCategoryId });
      const key = this.generateKey(todo.id);
      const serializedData = this.serialize(updated);
      pipeline.hmset(key, serializedData);

      // 인덱스 업데이트
      this.updateUserIndexes(pipeline, updated, todo);
      updatedCount++;
    }

    await pipeline.exec();
    return updatedCount;
  }

  async countByUserIdAndCompleted(
    userId: string,
    completed: boolean,
  ): Promise<number> {
    const completedKey = this.generateUserIndexKey(
      userId,
      "completed",
      completed.toString(),
    );
    return await this.redisService.scard(completedKey);
  }

  // 통계를 위한 효율적인 카운트 메서드들
  async getStatsForUser(userId: string): Promise<{
    total: number;
    completed: number;
    incomplete: number;
    byPriority: { high: number; medium: number; low: number };
  }> {
    const [total, completed, high, medium, low] = await Promise.all([
      this.countByUserId(userId),
      this.countByUserIdAndCompleted(userId, true),
      this.countByUserIdAndPriority(userId, "high"),
      this.countByUserIdAndPriority(userId, "medium"),
      this.countByUserIdAndPriority(userId, "low"),
    ]);

    return {
      total,
      completed,
      incomplete: total - completed,
      byPriority: { high, medium, low },
    };
  }

  private async countByUserIdAndPriority(
    userId: string,
    priority: string,
  ): Promise<number> {
    const priorityKey = this.generateUserIndexKey(userId, "priority", priority);
    return await this.redisService.scard(priorityKey);
  }

  // 타입별 검색 메서드 추가
  async findByUserIdAndType(
    userId: string,
    todoType: "event" | "task",
  ): Promise<TodoEntity[]> {
    const typeKey = this.generateUserIndexKey(userId, "type", todoType);
    const todoIds = await this.redisService.smembers(typeKey);

    return this.findByIds(todoIds);
  }

  async countByUserIdAndType(
    userId: string,
    todoType: "event" | "task",
  ): Promise<number> {
    const typeKey = this.generateUserIndexKey(userId, "type", todoType);
    return await this.redisService.scard(typeKey);
  }
}
