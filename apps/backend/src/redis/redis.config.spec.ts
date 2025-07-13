import { ConfigService } from "@nestjs/config";
import { createRedisConfig } from "./redis.config";

describe("createRedisConfig", () => {
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create Redis config with default values", () => {
    configService.get.mockImplementation(
      (key: string, defaultValue?: unknown) => {
        const config: Record<string, unknown> = {};
        return config[key] ?? defaultValue;
      },
    );

    const result = createRedisConfig(configService);

    expect(result).toEqual({
      host: "localhost",
      port: 6379,
      password: undefined,
      db: 0,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 60000,
      commandTimeout: 5000,
      retryStrategy: expect.any(Function) as (times: number) => number,
      reconnectOnError: expect.any(Function) as (error: Error) => boolean,
    });

    expect(configService.get).toHaveBeenCalledWith("REDIS_HOST", "localhost");
    expect(configService.get).toHaveBeenCalledWith("REDIS_PORT", 6379);
    expect(configService.get).toHaveBeenCalledWith("REDIS_PASSWORD");
    expect(configService.get).toHaveBeenCalledWith("REDIS_DB", 0);
  });

  it("should create Redis config with custom values", () => {
    configService.get.mockImplementation(
      (key: string, defaultValue?: unknown) => {
        const config: Record<string, unknown> = {
          REDIS_HOST: "redis.example.com",
          REDIS_PORT: 6380,
          REDIS_PASSWORD: "secret123",
          REDIS_DB: 2,
        };
        return config[key] ?? defaultValue;
      },
    );

    const result = createRedisConfig(configService);

    expect(result.host).toBe("redis.example.com");
    expect(result.port).toBe(6380);
    expect(result.password).toBe("secret123");
    expect(result.db).toBe(2);
  });

  it("should create Redis config with mixed custom and default values", () => {
    configService.get.mockImplementation(
      (key: string, defaultValue?: unknown) => {
        const config: Record<string, unknown> = {
          REDIS_HOST: "custom.redis.host",
          REDIS_PASSWORD: "mypassword",
        };
        return config[key] ?? defaultValue;
      },
    );

    const result = createRedisConfig(configService);

    expect(result.host).toBe("custom.redis.host");
    expect(result.port).toBe(6379); // default
    expect(result.password).toBe("mypassword");
    expect(result.db).toBe(0); // default
  });

  describe("retryStrategy", () => {
    it("should calculate delay correctly for retries", () => {
      configService.get.mockImplementation((key, defaultValue) => defaultValue);
      const config = createRedisConfig(configService);
      const retryStrategy = config.retryStrategy as (times: number) => number;

      expect(retryStrategy(1)).toBe(50); // 1 * 50
      expect(retryStrategy(5)).toBe(250); // 5 * 50
      expect(retryStrategy(10)).toBe(500); // 10 * 50
      expect(retryStrategy(50)).toBe(2000); // capped at 2000
      expect(retryStrategy(100)).toBe(2000); // capped at 2000
    });

    it("should cap delay at 2000ms", () => {
      configService.get.mockImplementation((key, defaultValue) => defaultValue);
      const config = createRedisConfig(configService);
      const retryStrategy = config.retryStrategy as (times: number) => number;

      expect(retryStrategy(40)).toBe(2000);
      expect(retryStrategy(41)).toBe(2000);
      expect(retryStrategy(100)).toBe(2000);
    });
  });

  describe("reconnectOnError", () => {
    it("should return true for READONLY errors", () => {
      configService.get.mockImplementation((key, defaultValue) => defaultValue);
      const config = createRedisConfig(configService);
      const reconnectOnError = config.reconnectOnError as (
        error: Error,
      ) => boolean;

      const readonlyError = new Error("Server is READONLY, cannot write");
      expect(reconnectOnError(readonlyError)).toBe(true);

      const anotherReadonlyError = new Error(
        "READONLY You can't write against a read only replica",
      );
      expect(reconnectOnError(anotherReadonlyError)).toBe(true);
    });

    it("should return false for non-READONLY errors", () => {
      configService.get.mockImplementation((key, defaultValue) => defaultValue);
      const config = createRedisConfig(configService);
      const reconnectOnError = config.reconnectOnError as (
        error: Error,
      ) => boolean;

      const connectionError = new Error("Connection timeout");
      expect(reconnectOnError(connectionError)).toBe(false);

      const authError = new Error("Authentication failed");
      expect(reconnectOnError(authError)).toBe(false);

      const networkError = new Error("Network error");
      expect(reconnectOnError(networkError)).toBe(false);
    });

    it("should handle case-sensitive READONLY check", () => {
      configService.get.mockImplementation((key, defaultValue) => defaultValue);
      const config = createRedisConfig(configService);
      const reconnectOnError = config.reconnectOnError as (
        error: Error,
      ) => boolean;

      const lowercaseError = new Error("readonly mode enabled");
      expect(reconnectOnError(lowercaseError)).toBe(false);

      const mixedcaseError = new Error("ReadOnly mode active");
      expect(reconnectOnError(mixedcaseError)).toBe(false);

      const uppercaseError = new Error("READONLY mode enabled");
      expect(reconnectOnError(uppercaseError)).toBe(true);
    });
  });

  it("should have correct timeout and retry configurations", () => {
    configService.get.mockImplementation((key, defaultValue) => defaultValue);
    const config = createRedisConfig(configService);

    expect(config.maxRetriesPerRequest).toBe(3);
    expect(config.lazyConnect).toBe(true);
    expect(config.connectTimeout).toBe(60000);
    expect(config.commandTimeout).toBe(5000);
  });
});
