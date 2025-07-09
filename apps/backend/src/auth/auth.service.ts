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
      const payload = this.jwtAuthService.verifyRefreshToken(refreshToken);
      const user = await this.userService.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  private generateTokens(user: User): AuthResponse {
    const accessToken = this.jwtAuthService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = this.jwtAuthService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: user.toProfile(),
    };
  }
}
