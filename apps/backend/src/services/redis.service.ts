import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';

export class RedisService {
  private redis: Redis;
  private prefix: string;

  constructor(app: FastifyInstance) {
    this.redis = app.redis;
    this.prefix = 'todo:';
  }

  generateKey(...parts: string[]): string {
    return this.prefix + parts.join(':');
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async hmset(key: string, data: Record<string, string>): Promise<string> {
    return await this.redis.hmset(key, data);
  }

  async del(key: string): Promise<number> {
    return await this.redis.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.redis.exists(key);
  }

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

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    return await this.redis.zrangebyscore(key, min, max);
  }

  async zcard(key: string): Promise<number> {
    return await this.redis.zcard(key);
  }

  pipeline() {
    return this.redis.pipeline();
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    if (ttl) {
      return await this.redis.set(key, value, 'EX', ttl);
    }
    return await this.redis.set(key, value);
  }

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  async scan(cursor: string, pattern: string, count: number = 10): Promise<[string, string[]]> {
    return await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
  }
}