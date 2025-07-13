import { Injectable } from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "@calendar-todo/shared-types";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  generateAccessToken(
    userId: string,
    email: string,
    rememberMe = false,
  ): string {
    const payload: Omit<JwtPayload, "iat" | "exp"> = {
      sub: userId,
      email,
    };

    // 로그인 유지 시 3개월, 기본 24시간
    const expiresIn = rememberMe ? "90d" : "24h";

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn,
    });
  }

  generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: "refresh" },
      {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: "7d", // 7일
      },
    );
  }

  async generateTokenPair(
    userId: string,
    email: string,
    rememberMe = false,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(userId, email, rememberMe);
    const refreshToken = this.generateRefreshToken(userId);

    // Store refresh token in Redis with expiration
    const refreshTokenKey = this.redisService.generateKey(
      "refresh_token",
      userId,
    );
    await this.redisService.set(
      refreshTokenKey,
      refreshToken,
      7 * 24 * 60 * 60,
    ); // 7 days

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>("JWT_SECRET"),
    });
  }

  verifyRefreshToken(token: string): { sub: string; type: string } {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
    });
  }

  async isRefreshTokenValid(userId: string, token: string): Promise<boolean> {
    const refreshTokenKey = this.redisService.generateKey(
      "refresh_token",
      userId,
    );
    const storedToken = await this.redisService.get(refreshTokenKey);

    return storedToken === token;
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    const refreshTokenKey = this.redisService.generateKey(
      "refresh_token",
      userId,
    );
    await this.redisService.del(refreshTokenKey);
  }

  private isJwtPayload(decoded: unknown): decoded is JwtPayload {
    if (typeof decoded !== "object" || decoded === null) {
      return false;
    }

    const obj = decoded as Record<string, unknown>;
    return (
      typeof obj.sub === "string" &&
      typeof obj.email === "string" &&
      typeof obj.iat === "number" &&
      typeof obj.exp === "number"
    );
  }

  private safeDecodeToken(token: string): JwtPayload | null {
    try {
      const decoded: unknown = this.jwtService.decode(token);
      return this.isJwtPayload(decoded) ? decoded : null;
    } catch {
      return null;
    }
  }

  async blacklistToken(token: string): Promise<void> {
    const decoded = this.safeDecodeToken(token);
    if (decoded) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        const blacklistKey = this.redisService.generateKey("blacklist", token);
        await this.redisService.set(blacklistKey, "1", ttl);
      }
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistKey = this.redisService.generateKey("blacklist", token);
    return await this.redisService.exists(blacklistKey);
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      const userId = decoded.sub;

      // Check if refresh token is still valid in Redis
      const isValid = await this.isRefreshTokenValid(userId, refreshToken);
      if (!isValid) {
        return null;
      }

      // Get user info to generate new access token
      const userKey = this.redisService.generateKey("user", userId);
      const userData = await this.redisService.hgetall(userKey);

      if (!userData || !userData.email) {
        return null;
      }

      // Generate new token pair
      return await this.generateTokenPair(userId, userData.email);
    } catch {
      return null;
    }
  }

  decodeToken(token: string): JwtPayload | null {
    return this.safeDecodeToken(token);
  }
}
