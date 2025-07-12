import type { ChainableCommander } from "ioredis";

export type RedisPipeline = ChainableCommander;

export interface RedisError {
  error: Error | null;
}

export type PipelineResult = [RedisError["error"], unknown][];
