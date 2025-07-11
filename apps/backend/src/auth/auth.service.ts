import { Injectable } from "@nestjs/common";
import { UserService } from "../users/user.service";
import { JwtAuthService } from "./jwt.service";
import { User } from "../users/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { AuthResponse } from "@calendar-todo/shared-types";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.userService.create(registerDto);
    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    return this.userService.validatePassword(email, password);
  }

  async login(user: User): Promise<AuthResponse> {
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const tokens = await this.jwtAuthService.refreshAccessToken(refreshToken);

      if (!tokens) {
        throw new Error("Invalid refresh token");
      }

      const payload = this.jwtAuthService.verifyRefreshToken(
        tokens.refreshToken,
      );
      const user = await this.userService.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: user.toProfile(),
      };
    } catch {
      throw new Error("Invalid refresh token");
    }
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    // Revoke refresh token
    await this.jwtAuthService.revokeRefreshToken(userId);

    // Blacklist access token
    await this.jwtAuthService.blacklistToken(accessToken);
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.jwtAuthService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return false;
      }

      // Verify token signature and expiration
      this.jwtAuthService.verifyAccessToken(token);
      return true;
    } catch {
      return false;
    }
  }

  private async generateTokens(user: User): Promise<AuthResponse> {
    const tokens = await this.jwtAuthService.generateTokenPair(
      user.id,
      user.email,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user.toProfile(),
    };
  }
}
