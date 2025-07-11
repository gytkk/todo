import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { createRedisConfig } from "./redis.config";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;
  private readonly keyPrefix = "todo";

  constructor(private readonly configService: ConfigService) {
    const config = createRedisConfig(configService);
    this.redis = new Redis(config);

    this.redis.on("connect", () => {
      this.logger.log("Redis connected");
    });

    this.redis.on("ready", () => {
      this.logger.log("Redis ready");
    });

    this.redis.on("error", (error) => {
      this.logger.error("Redis error", error.stack);
    });

    this.redis.on("close", () => {
      this.logger.log("Redis connection closed");
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === "PONG";
    } catch (error) {
      this.logger.error("Redis ping failed", error);
      return false;
    }
  }

  // Basic key-value operations
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<string | null> {
    if (ttl) {
      return await this.redis.set(key, value, "EX", ttl);
    }
    return await this.redis.set(key, value);
  }

  async del(key: string): Promise<number> {
    return await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async expire(key: string, ttl: number): Promise<number> {
    return await this.redis.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    return await this.redis.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.redis.hset(key, field, value);
  }

  async hdel(key: string, field: string): Promise<number> {
    return await this.redis.hdel(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async hmset(key: string, data: Record<string, string>): Promise<string> {
    return await this.redis.hmset(key, data);
  }

  async hkeys(key: string): Promise<string[]> {
    return await this.redis.hkeys(key);
  }

  async hvals(key: string): Promise<string[]> {
    return await this.redis.hvals(key);
  }

  async hlen(key: string): Promise<number> {
    return await this.redis.hlen(key);
  }

  async hexists(key: string, field: string): Promise<boolean> {
    const result = await this.redis.hexists(key, field);
    return result === 1;
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    return await this.redis.zadd(key, score, member);
  }

  async zrem(key: string, member: string): Promise<number> {
    return await this.redis.zrem(key, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redis.zrange(key, start, stop);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redis.zrevrange(key, start, stop);
  }

  async zrangebyscore(
    key: string,
    min: number,
    max: number,
  ): Promise<string[]> {
    return await this.redis.zrangebyscore(key, min, max);
  }

  async zcard(key: string): Promise<number> {
    return await this.redis.zcard(key);
  }

  async zscore(key: string, member: string): Promise<string | null> {
    return await this.redis.zscore(key, member);
  }

  async zcount(key: string, min: number, max: number): Promise<number> {
    return await this.redis.zcount(key, min, max);
  }

  // Set operations
  async sadd(key: string, member: string): Promise<number> {
    return await this.redis.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return await this.redis.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.redis.sismember(key, member);
    return result === 1;
  }

  async scard(key: string): Promise<number> {
    return await this.redis.scard(key);
  }

  // List operations
  async lpush(key: string, value: string): Promise<number> {
    return await this.redis.lpush(key, value);
  }

  async rpush(key: string, value: string): Promise<number> {
    return await this.redis.rpush(key, value);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.redis.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.redis.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redis.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return await this.redis.llen(key);
  }

  // Pattern matching
  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  async scan(
    cursor: number = 0,
    pattern?: string,
    count?: number,
  ): Promise<[string, string[]]> {
    if (pattern && count) {
      return await this.redis.scan(cursor, "MATCH", pattern, "COUNT", count);
    } else if (pattern) {
      return await this.redis.scan(cursor, "MATCH", pattern);
    } else if (count) {
      return await this.redis.scan(cursor, "COUNT", count);
    } else {
      return await this.redis.scan(cursor);
    }
  }

  // Transaction operations
  pipeline() {
    return this.redis.pipeline();
  }

  multi() {
    return this.redis.multi();
  }

  // Utility methods
  generateKey(type: string, ...parts: string[]): string {
    return [this.keyPrefix, type, ...parts].join(":");
  }

  serializeData(data: unknown): string {
    return JSON.stringify(data);
  }

  deserializeData<T>(data: string | null): T | null {
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error("Failed to deserialize data", error);
      return null;
    }
  }

  // Database operations
  async flushdb(): Promise<string> {
    return await this.redis.flushdb();
  }

  async flushall(): Promise<string> {
    return await this.redis.flushall();
  }

  // Info operations
  async info(section?: string): Promise<string> {
    if (section) {
      return await this.redis.info(section);
    } else {
      return await this.redis.info();
    }
  }

  async dbsize(): Promise<number> {
    return await this.redis.dbsize();
  }

  // Connection status
  get status(): string {
    return this.redis.status;
  }

  get isConnected(): boolean {
    return this.redis.status === "ready";
  }

  // Advanced operations
  async batch(
    operations: Array<{ command: string; args: unknown[] }>,
  ): Promise<unknown[]> {
    const pipeline = this.redis.pipeline();

    for (const operation of operations) {
      (pipeline as unknown as Record<string, (...args: unknown[]) => unknown>)[
        operation.command
      ](...operation.args);
    }

    const results = await pipeline.exec();
    return results?.map((result) => result[1]) || [];
  }

  async lock(key: string, value: string, ttl: number = 10): Promise<boolean> {
    const result = await this.redis.set(key, value, "PX", ttl * 1000, "NX");
    return result === "OK";
  }

  async unlock(key: string, value: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.redis.eval(script, 1, key, value);
    return result === 1;
  }
}
