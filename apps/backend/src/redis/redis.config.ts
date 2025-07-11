import { ConfigService } from "@nestjs/config";
import { RedisOptions } from "ioredis";

export const createRedisConfig = (
  configService: ConfigService,
): RedisOptions => {
  return {
    host: configService.get<string>("REDIS_HOST", "localhost"),
    port: configService.get<number>("REDIS_PORT", 6379),
    password: configService.get<string>("REDIS_PASSWORD"),
    db: configService.get<number>("REDIS_DB", 0),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 60000,
    commandTimeout: 5000,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (error: Error) => {
      const targetError = "READONLY";
      return error.message.includes(targetError);
    },
  };
};
