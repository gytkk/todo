import { Injectable } from "@nestjs/common";
import { RedisService } from "../../redis/redis.service";
import type { RedisPipeline } from "../types/redis.types";
import { BaseRedisRepository } from "./base-redis.repository";
import { UserScopedRepository } from "../interfaces/repository.interface";

@Injectable()
export abstract class UserScopedRedisRepository<
    T extends { id: string; userId: string },
  >
  extends BaseRedisRepository<T>
  implements UserScopedRepository<T>
{
  constructor(redisService: RedisService) {
    super(redisService);
  }

  protected generateUserListKey(userId: string): string {
    return this.redisService.generateKey(this.entityName, "user", userId);
  }

  protected generateUserIndexKey(
    userId: string,
    field: string,
    value: string,
  ): string {
    return this.redisService.generateKey(
      this.entityName,
      "user",
      userId,
      "index",
      field,
      value,
    );
  }

  async findByUserId(userId: string): Promise<T[]> {
    const userListKey = this.generateUserListKey(userId);
    const ids = await this.redisService.zrevrange(userListKey, 0, -1);

    if (ids.length === 0) {
      return [];
    }

    return this.findByIds(ids);
  }

  async findByUserIdAndId(userId: string, id: string): Promise<T | null> {
    const entity = await this.findById(id);

    if (!entity || entity.userId !== userId) {
      return null;
    }

    return entity;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const userListKey = this.generateUserListKey(userId);
    const ids = await this.redisService.zrange(userListKey, 0, -1);

    if (ids.length === 0) {
      return true;
    }

    // Pipeline을 사용하여 배치 삭제
    const pipeline = this.redisService.pipeline();

    // 각 엔티티 삭제
    ids.forEach((id) => {
      const key = this.generateKey(id);
      pipeline.del(key);
    });

    // 사용자별 리스트 삭제
    pipeline.del(userListKey);

    // 전역 리스트에서 항목들 제거
    const globalListKey = this.generateListKey();
    ids.forEach((id) => {
      pipeline.zrem(globalListKey, id);
    });

    // 사용자별 인덱스 정리
    await this.removeUserIndexes(pipeline, userId);

    const results = await pipeline.exec();
    return results ? results.some(([error]) => !error) : false;
  }

  async countByUserId(userId: string): Promise<number> {
    const userListKey = this.generateUserListKey(userId);
    return await this.redisService.zcard(userListKey);
  }

  protected async updateIndexes(
    pipeline: RedisPipeline,
    newEntity: T,
    oldEntity: T | null,
  ): Promise<void> {
    // 전역 인덱스 업데이트
    await super.updateIndexes(pipeline, newEntity, oldEntity);

    // 사용자별 리스트 관리
    const userListKey = this.generateUserListKey(newEntity.userId);
    const timestamp =
      (newEntity as { createdAt?: Date }).createdAt?.getTime() || Date.now();
    pipeline.zadd(userListKey, timestamp, newEntity.id);

    // 사용자별 인덱스 업데이트
    await this.updateUserIndexes(pipeline, newEntity, oldEntity);
  }

  protected async removeFromIndexes(
    pipeline: RedisPipeline,
    entity: T,
  ): Promise<void> {
    // 전역 인덱스 정리
    await super.removeFromIndexes(pipeline, entity);

    // 사용자별 리스트에서 제거
    const userListKey = this.generateUserListKey(entity.userId);
    pipeline.zrem(userListKey, entity.id);

    // 사용자별 인덱스 정리
    await this.removeUserEntityIndexes(pipeline, entity);
  }

  // 하위 클래스에서 구현할 사용자별 인덱스 관리 메서드들
  protected updateUserIndexes(
    _pipeline: RedisPipeline,
    _newEntity: T,
    _oldEntity: T | null,
  ): Promise<void> | void {
    // 기본 구현은 비어있음 - 하위 클래스에서 필요에 따라 구현
  }

  protected removeUserEntityIndexes(
    _pipeline: RedisPipeline,
    _entity: T,
  ): Promise<void> | void {
    // 기본 구현은 비어있음 - 하위 클래스에서 필요에 따라 구현
  }

  protected removeUserIndexes(
    _pipeline: RedisPipeline,
    _userId: string,
  ): Promise<void> | void {
    // 기본 구현은 비어있음 - 하위 클래스에서 필요에 따라 구현
  }

  // 날짜 범위 검색을 위한 헬퍼 메서드
  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<T[]> {
    const userListKey = this.generateUserListKey(userId);
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    const ids = await this.redisService.zrangebyscore(
      userListKey,
      startTimestamp,
      endTimestamp,
    );

    if (ids.length === 0) {
      return [];
    }

    return this.findByIds(ids);
  }
}
