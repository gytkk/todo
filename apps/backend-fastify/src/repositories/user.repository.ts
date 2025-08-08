import { FastifyInstance } from 'fastify';
import { ChainableCommander } from 'ioredis';
import { BaseRedisRepository } from './base-redis.repository';
import { User } from '../entities/user.entity';
import { generateId } from '../utils/id-generator';
import {
  serializeDate,
  deserializeDate,
  serializeBoolean,
  deserializeBoolean,
} from '../utils/serialization';

export class UserRepository extends BaseRedisRepository<User> {
  protected entityName = 'user';

  constructor(app: FastifyInstance) {
    super(app);
  }

  protected serialize(entity: User): Record<string, string> {
    return {
      id: entity.id,
      email: entity.email,
      password: entity.password,
      name: entity.name,
      profileImage: entity.profileImage || '',
      isActive: serializeBoolean(entity.isActive),
      createdAt: serializeDate(entity.createdAt),
      updatedAt: serializeDate(entity.updatedAt),
    };
  }

  protected deserialize(data: Record<string, string>): User {
    return {
      id: data.id,
      email: data.email,
      password: data.password,
      name: data.name,
      profileImage: data.profileImage || undefined,
      isActive: deserializeBoolean(data.isActive),
      createdAt: deserializeDate(data.createdAt) || new Date(),
      updatedAt: deserializeDate(data.updatedAt) || new Date(),
    };
  }

  protected createEntity(data: Partial<User>): User {
    const now = new Date();
    return {
      id: data.id || generateId('user'),
      email: data.email || '',
      password: data.password || '',
      name: data.name || '',
      profileImage: data.profileImage,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
  }

  protected updateEntity(existing: User, updates: Partial<User>): User {
    return {
      ...existing,
      ...updates,
      id: existing.id, // ID는 변경 불가
      createdAt: existing.createdAt, // 생성일은 변경 불가
      updatedAt: new Date(), // 수정일은 항상 현재 시간
    };
  }

  // Email로 사용자 찾기
  async findByEmail(email: string): Promise<User | null> {
    const indexKey = this.generateIndexKey('email', email.toLowerCase());
    const userId = await this.redisService.get(indexKey);
    
    if (!userId) {
      return null;
    }
    
    return this.findById(userId);
  }

  // 인덱스 관리
  protected async updateIndexes(
    pipeline: ChainableCommander,
    newEntity: User,
    oldEntity: User | null,
  ): Promise<void> {
    // 이전 이메일 인덱스 제거
    if (oldEntity && oldEntity.email !== newEntity.email) {
      const oldIndexKey = this.generateIndexKey('email', oldEntity.email.toLowerCase());
      pipeline.del(oldIndexKey);
    }

    // 새 이메일 인덱스 추가
    const newIndexKey = this.generateIndexKey('email', newEntity.email.toLowerCase());
    pipeline.set(newIndexKey, newEntity.id);
  }

  protected async removeFromIndexes(
    pipeline: ChainableCommander,
    entity: User,
  ): Promise<void> {
    // 이메일 인덱스 제거
    const indexKey = this.generateIndexKey('email', entity.email.toLowerCase());
    pipeline.del(indexKey);
  }

  // 이메일 중복 확인
  async emailExists(email: string): Promise<boolean> {
    const indexKey = this.generateIndexKey('email', email.toLowerCase());
    const exists = await this.redisService.exists(indexKey);
    return exists > 0;
  }
}