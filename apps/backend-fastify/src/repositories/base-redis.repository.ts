import { FastifyInstance } from 'fastify';
import { RedisService } from '../services/redis.service';
import { ChainableCommander } from 'ioredis';
import {
  BaseRepository,
  PaginatedResult,
  PaginationOptions,
} from './interfaces/repository.interface';

export abstract class BaseRedisRepository<T extends { id: string }>
  implements BaseRepository<T>
{
  protected abstract entityName: string;
  protected redisService: RedisService;

  constructor(protected app: FastifyInstance) {
    this.redisService = new RedisService(app);
  }

  protected generateKey(id: string): string {
    return this.redisService.generateKey(this.entityName, id);
  }

  protected generateListKey(): string {
    return this.redisService.generateKey(this.entityName, 'list');
  }

  protected generateIndexKey(field: string, value: string): string {
    return this.redisService.generateKey(
      this.entityName,
      'index',
      field,
      value,
    );
  }

  protected abstract serialize(entity: T): Record<string, string>;
  protected abstract deserialize(data: Record<string, string>): T;

  async findById(id: string): Promise<T | null> {
    const key = this.generateKey(id);
    const data = await this.redisService.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return this.deserialize(data);
  }

  async findAll(): Promise<T[]> {
    const listKey = this.generateListKey();
    const ids = await this.redisService.zrange(listKey, 0, -1);

    if (ids.length === 0) {
      return [];
    }

    return this.findByIds(ids);
  }

  async findByIds(ids: string[]): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }

    // Redis Pipeline을 사용하여 배치 처리
    const pipeline = this.redisService.pipeline();
    ids.forEach((id) => {
      const key = this.generateKey(id);
      pipeline.hgetall(key);
    });

    const results = await pipeline.exec();
    const entities: T[] = [];

    if (results) {
      for (const [error, data] of results) {
        if (
          !error &&
          data &&
          Object.keys(data as Record<string, string>).length > 0
        ) {
          entities.push(this.deserialize(data as Record<string, string>));
        }
      }
    }

    return entities;
  }

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = this.createEntity(entity);
    const key = this.generateKey(newEntity.id);
    const listKey = this.generateListKey();
    const serializedData = this.serialize(newEntity);

    // Pipeline을 사용하여 원자적 처리
    const pipeline = this.redisService.pipeline();
    pipeline.hmset(key, serializedData);
    pipeline.zadd(listKey, Date.now(), newEntity.id);

    // 인덱스 업데이트
    await this.updateIndexes(pipeline, newEntity, null);

    await pipeline.exec();
    return newEntity;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updated = this.updateEntity(existing, updates);
    const key = this.generateKey(id);
    const serializedData = this.serialize(updated);

    // Pipeline을 사용하여 원자적 처리
    const pipeline = this.redisService.pipeline();
    pipeline.hmset(key, serializedData);

    // 인덱스 업데이트
    await this.updateIndexes(pipeline, updated, existing);

    await pipeline.exec();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    const key = this.generateKey(id);
    const listKey = this.generateListKey();

    // Pipeline을 사용하여 원자적 처리
    const pipeline = this.redisService.pipeline();
    pipeline.del(key);
    pipeline.zrem(listKey, id);

    // 인덱스 정리
    await this.removeFromIndexes(pipeline, existing);

    const results = await pipeline.exec();
    return results ? (results[0][1] as number) > 0 : false;
  }

  async exists(id: string): Promise<boolean> {
    const key = this.generateKey(id);
    const result = await this.redisService.exists(key);
    return result > 0;
  }

  async findPaginated(options: PaginationOptions): Promise<PaginatedResult<T>> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    const listKey = this.generateListKey();
    const total = await this.redisService.zcard(listKey);
    const ids = await this.redisService.zrevrange(
      listKey,
      offset,
      offset + limit - 1,
    );

    const items = await this.findByIds(ids);

    return {
      items,
      total,
      page,
      limit,
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
  }

  protected abstract createEntity(data: Partial<T>): T;
  protected abstract updateEntity(existing: T, updates: Partial<T>): T;

  // 하위 클래스에서 인덱스 관리를 위해 오버라이드할 수 있는 메서드들
  protected updateIndexes(
    _pipeline: ChainableCommander,
    _newEntity: T,
    _oldEntity: T | null,
  ): Promise<void> | void {
    // 기본 구현은 비어있음 - 하위 클래스에서 필요에 따라 구현
  }

  protected removeFromIndexes(
    _pipeline: ChainableCommander,
    _entity: T,
  ): Promise<void> | void {
    // 기본 구현은 비어있음 - 하위 클래스에서 필요에 따라 구현
  }
}