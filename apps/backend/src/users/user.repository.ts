import { Injectable } from "@nestjs/common";
import { User } from "./user.entity";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class UserRepository {
  constructor(private readonly redisService: RedisService) {}

  async findAll(): Promise<User[]> {
    const userListKey = this.redisService.generateKey("user", "list");
    const userIds = await this.redisService.zrange(userListKey, 0, -1);

    const users: User[] = [];
    for (const userId of userIds) {
      const user = await this.findById(userId);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  async findById(id: string): Promise<User | null> {
    const userKey = this.redisService.generateKey("user", id);
    const userData = await this.redisService.hgetall(userKey);

    if (!userData || Object.keys(userData).length === 0) {
      return null;
    }

    return new User({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      passwordHash: userData.passwordHash,
      profileImage: userData.profileImage,
      emailVerified: userData.emailVerified === "true",
      isActive: userData.isActive === "true",
      createdAt: new Date(userData.createdAt),
      updatedAt: new Date(userData.updatedAt),
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const emailKey = this.redisService.generateKey("user", "email", email);
    const userId = await this.redisService.get(emailKey);

    if (!userId) {
      return null;
    }

    return await this.findById(userId);
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = new User(userData);
    const userKey = this.redisService.generateKey("user", user.id);
    const emailKey = this.redisService.generateKey("user", "email", user.email);
    const userListKey = this.redisService.generateKey("user", "list");

    const userHashData = {
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

    await this.redisService.hmset(userKey, userHashData);
    await this.redisService.set(emailKey, user.id);
    await this.redisService.zadd(
      userListKey,
      user.createdAt.getTime(),
      user.id,
    );

    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      return null;
    }

    const updatedUser = new User({
      ...existingUser,
      ...updateData,
      updatedAt: new Date(),
    });

    const userKey = this.redisService.generateKey("user", id);
    const userHashData = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || "",
      passwordHash: updatedUser.passwordHash,
      profileImage: updatedUser.profileImage || "",
      emailVerified: updatedUser.emailVerified.toString(),
      isActive: updatedUser.isActive.toString(),
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    await this.redisService.hmset(userKey, userHashData);

    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      return false;
    }

    const userKey = this.redisService.generateKey("user", id);
    const emailKey = this.redisService.generateKey(
      "user",
      "email",
      existingUser.email,
    );
    const userListKey = this.redisService.generateKey("user", "list");

    await this.redisService.del(userKey);
    await this.redisService.del(emailKey);
    await this.redisService.zrem(userListKey, id);

    return true;
  }

  async exists(email: string): Promise<boolean> {
    const emailKey = this.redisService.generateKey("user", "email", email);
    return await this.redisService.exists(emailKey);
  }
}
