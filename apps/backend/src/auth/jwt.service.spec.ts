import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { JwtAuthService } from "./jwt.service";
import { RedisService } from "../redis/redis.service";
import { JwtPayload } from "@calendar-todo/shared-types";

describe("JwtAuthService", () => {
  let service: JwtAuthService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRedisService = {
    generateKey: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    hgetall: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<JwtAuthService>(JwtAuthService);

    // Setup default mocks
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === "JWT_SECRET") return "test-secret";
      if (key === "JWT_REFRESH_SECRET") return "test-refresh-secret";
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    const userId = "test-user-id";
    const email = "test@example.com";
    const mockToken = "mock-access-token";

    beforeEach(() => {
      mockJwtService.sign.mockReturnValue(mockToken);
    });

    it("should generate access token with 24 hours expiration when rememberMe is false", () => {
      const result = service.generateAccessToken(userId, email, false);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: userId, email },
        {
          secret: "test-secret",
          expiresIn: "24h",
        },
      );
      expect(result).toBe(mockToken);
    });

    it("should generate access token with 90 days expiration when rememberMe is true", () => {
      const result = service.generateAccessToken(userId, email, true);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: userId, email },
        {
          secret: "test-secret",
          expiresIn: "90d",
        },
      );
      expect(result).toBe(mockToken);
    });

    it("should default to 24 hours expiration when rememberMe is not provided", () => {
      const result = service.generateAccessToken(userId, email);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: userId, email },
        {
          secret: "test-secret",
          expiresIn: "24h",
        },
      );
      expect(result).toBe(mockToken);
    });
  });

  describe("generateRefreshToken", () => {
    const userId = "test-user-id";
    const mockRefreshToken = "mock-refresh-token";

    beforeEach(() => {
      mockJwtService.sign.mockReturnValue(mockRefreshToken);
    });

    it("should generate refresh token with 7 days expiration", () => {
      const result = service.generateRefreshToken(userId);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: userId, type: "refresh" },
        {
          secret: "test-refresh-secret",
          expiresIn: "7d",
        },
      );
      expect(result).toBe(mockRefreshToken);
    });
  });

  describe("generateTokenPair", () => {
    const userId = "test-user-id";
    const email = "test@example.com";
    const mockAccessToken = "mock-access-token";
    const mockRefreshToken = "mock-refresh-token";

    beforeEach(() => {
      mockJwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      mockRedisService.generateKey.mockReturnValue(
        "refresh_token:test-user-id",
      );
      mockRedisService.set.mockResolvedValue(undefined);
    });

    it("should generate token pair with correct expiration times for rememberMe false", async () => {
      const result = await service.generateTokenPair(userId, email, false);

      // Check access token generation
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: userId, email },
        {
          secret: "test-secret",
          expiresIn: "24h",
        },
      );

      // Check refresh token generation
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: userId, type: "refresh" },
        {
          secret: "test-refresh-secret",
          expiresIn: "7d",
        },
      );

      // Check Redis storage
      expect(mockRedisService.generateKey).toHaveBeenCalledWith(
        "refresh_token",
        userId,
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "refresh_token:test-user-id",
        mockRefreshToken,
        7 * 24 * 60 * 60, // 7 days in seconds
      );

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it("should generate token pair with correct expiration times for rememberMe true", async () => {
      const result = await service.generateTokenPair(userId, email, true);

      // Check access token generation with 90 days
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: userId, email },
        {
          secret: "test-secret",
          expiresIn: "90d",
        },
      );

      // Refresh token should still be 7 days
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: userId, type: "refresh" },
        {
          secret: "test-refresh-secret",
          expiresIn: "7d",
        },
      );

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it("should default to 24 hours expiration when rememberMe is not provided", async () => {
      const result = await service.generateTokenPair(userId, email);

      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: userId, email },
        {
          secret: "test-secret",
          expiresIn: "24h",
        },
      );

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });
  });

  describe("verifyAccessToken", () => {
    const mockToken = "mock-access-token";
    const mockPayload: JwtPayload = {
      sub: "test-user-id",
      email: "test@example.com",
      iat: 1234567890,
      exp: 1234567890 + 86400, // 24 hours later
    };

    it("should verify access token successfully", () => {
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = service.verifyAccessToken(mockToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: "test-secret",
      });
      expect(result).toEqual(mockPayload);
    });
  });

  describe("verifyRefreshToken", () => {
    const mockToken = "mock-refresh-token";
    const mockPayload = {
      sub: "test-user-id",
      type: "refresh",
    };

    it("should verify refresh token successfully", () => {
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = service.verifyRefreshToken(mockToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: "test-refresh-secret",
      });
      expect(result).toEqual(mockPayload);
    });
  });

  describe("isRefreshTokenValid", () => {
    const userId = "test-user-id";
    const token = "mock-refresh-token";

    beforeEach(() => {
      mockRedisService.generateKey.mockReturnValue(
        "refresh_token:test-user-id",
      );
    });

    it("should return true if refresh token is valid", async () => {
      mockRedisService.get.mockResolvedValue(token);

      const result = await service.isRefreshTokenValid(userId, token);

      expect(mockRedisService.generateKey).toHaveBeenCalledWith(
        "refresh_token",
        userId,
      );
      expect(mockRedisService.get).toHaveBeenCalledWith(
        "refresh_token:test-user-id",
      );
      expect(result).toBe(true);
    });

    it("should return false if refresh token is invalid", async () => {
      mockRedisService.get.mockResolvedValue("different-token");

      const result = await service.isRefreshTokenValid(userId, token);

      expect(result).toBe(false);
    });

    it("should return false if no stored token found", async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.isRefreshTokenValid(userId, token);

      expect(result).toBe(false);
    });
  });

  describe("refreshAccessToken", () => {
    const refreshToken = "mock-refresh-token";
    const userId = "test-user-id";
    const mockAccessToken = "new-access-token";
    const mockNewRefreshToken = "new-refresh-token";

    beforeEach(() => {
      jest.clearAllMocks();
      mockJwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockNewRefreshToken);
      mockRedisService.set.mockResolvedValue(undefined);
    });

    it("should refresh access token successfully", async () => {
      mockRedisService.generateKey
        .mockReturnValueOnce("refresh_token:test-user-id")
        .mockReturnValueOnce("user:test-user-id")
        .mockReturnValueOnce("refresh_token:test-user-id");
      mockJwtService.verify.mockReturnValue({ sub: userId, type: "refresh" });
      mockRedisService.get.mockResolvedValue(refreshToken);
      mockRedisService.hgetall.mockResolvedValue({
        email: "test@example.com",
      });

      const result = await service.refreshAccessToken(refreshToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: "test-refresh-secret",
      });
      expect(mockRedisService.get).toHaveBeenCalledWith(
        "refresh_token:test-user-id",
      );
      expect(mockRedisService.generateKey).toHaveBeenCalledWith("user", userId);
      expect(mockRedisService.hgetall).toHaveBeenCalledWith(
        "user:test-user-id",
      );

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockNewRefreshToken,
      });
    });

    it("should return null if refresh token is invalid", async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = await service.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });

    it("should return null if stored token doesn't match", async () => {
      mockJwtService.verify.mockReturnValue({ sub: userId, type: "refresh" });
      mockRedisService.get.mockResolvedValue("different-token");

      const result = await service.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });

    it("should return null if user data not found", async () => {
      mockJwtService.verify.mockReturnValue({ sub: userId, type: "refresh" });
      mockRedisService.get.mockResolvedValue(refreshToken);
      mockRedisService.hgetall.mockResolvedValue(null);

      const result = await service.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });
  });

  describe("blacklistToken", () => {
    const token = "mock-token";
    const mockPayload: JwtPayload = {
      sub: "test-user-id",
      email: "test@example.com",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockRedisService.generateKey.mockReturnValue("blacklist:mock-token");
      mockRedisService.set.mockResolvedValue(undefined);
    });

    it("should blacklist valid token", async () => {
      mockJwtService.decode.mockReturnValue(mockPayload);

      await service.blacklistToken(token);

      expect(mockRedisService.generateKey).toHaveBeenCalledWith(
        "blacklist",
        token,
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "blacklist:mock-token",
        "1",
        expect.any(Number),
      );
    });

    it("should not blacklist expired token", async () => {
      const expiredPayload: JwtPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      };
      mockJwtService.decode.mockReturnValue(expiredPayload);

      await service.blacklistToken(token);

      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it("should handle invalid token gracefully", async () => {
      mockJwtService.decode.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(service.blacklistToken(token)).resolves.not.toThrow();
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
  });

  describe("isTokenBlacklisted", () => {
    const token = "mock-token";

    beforeEach(() => {
      jest.clearAllMocks();
      mockRedisService.generateKey.mockReturnValue("blacklist:mock-token");
    });

    it("should return true if token is blacklisted", async () => {
      mockRedisService.exists.mockResolvedValue(true);

      const result = await service.isTokenBlacklisted(token);

      expect(mockRedisService.generateKey).toHaveBeenCalledWith(
        "blacklist",
        token,
      );
      expect(mockRedisService.exists).toHaveBeenCalledWith(
        "blacklist:mock-token",
      );
      expect(result).toBe(true);
    });

    it("should return false if token is not blacklisted", async () => {
      mockRedisService.exists.mockResolvedValue(false);

      const result = await service.isTokenBlacklisted(token);

      expect(result).toBe(false);
    });
  });

  describe("decodeToken", () => {
    const token = "mock-token";
    const mockPayload: JwtPayload = {
      sub: "test-user-id",
      email: "test@example.com",
      iat: 1234567890,
      exp: 1234567890 + 86400,
    };

    it("should decode valid token", () => {
      mockJwtService.decode.mockReturnValue(mockPayload);

      const result = service.decodeToken(token);

      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockPayload);
    });

    it("should return null for invalid token", () => {
      mockJwtService.decode.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = service.decodeToken(token);

      expect(result).toBeNull();
    });

    it("should return null for malformed payload", () => {
      mockJwtService.decode.mockReturnValue({ invalid: "payload" });

      const result = service.decodeToken(token);

      expect(result).toBeNull();
    });
  });
});
