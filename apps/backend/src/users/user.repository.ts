import { Injectable } from "@nestjs/common";
import { User } from "./user.entity";
import { RedisService } from "../redis/redis.service";
import type { RedisPipeline } from "../common/types/redis.types";
import { BaseRedisRepository } from "../common/repositories/base-redis.repository";

@Injectable()
export class UserRepository extends BaseRedisRepository<User> {
  protected entityName = "user";

  constructor(redisService: RedisService) {
    super(redisService);
  }

  protected serialize(user: User): Record<string, string> {
    return {
      id: user.id,
      email: user.email,
      name: user.name || "",
      passwordHash: user.passwordHash,
      profileImage: user.profileImage || "",
      emailVerified: user.emailVerified.toString(),
      isActive: user.isActive.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  protected deserialize(data: Record<string, string>): User {
    return new User({
      id: data.id,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      profileImage: data.profileImage,
      emailVerified: data.emailVerified === "true",
      isActive: data.isActive === "true",
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  protected createEntity(data: Partial<User>): User {
    return new User(data);
  }

  protected updateEntity(existing: User, updates: Partial<User>): User {
    return new User({
      ...existing,
      ...updates,
      updatedAt: new Date(),
    });
  }

  protected updateIndexes(
    pipeline: RedisPipeline,
    newUser: User,
    oldUser: User | null,
  ): void {
    const emailKey = this.redisService.generateKey(
      "user",
      "email",
      newUser.email,
    );

    if (oldUser && oldUser.email !== newUser.email) {
      // 이메일이 변경된 경우 기존 인덱스 제거
      const oldEmailKey = this.redisService.generateKey(
        "user",
        "email",
        oldUser.email,
      );
      pipeline.del(oldEmailKey);
    }

    pipeline.set(emailKey, newUser.id);
  }

  protected removeFromIndexes(pipeline: RedisPipeline, user: User): void {
    const emailKey = this.redisService.generateKey("user", "email", user.email);
    pipeline.del(emailKey);
  }

  async findByEmail(email: string): Promise<User | null> {
    const emailKey = this.redisService.generateKey("user", "email", email);
    const userId = await this.redisService.get(emailKey);

    if (!userId) {
      return null;
    }

    return await this.findById(userId);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const emailKey = this.redisService.generateKey("user", "email", email);
    return await this.redisService.exists(emailKey);
  }
}
