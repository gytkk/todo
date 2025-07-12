import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { User } from "../users/user.entity";
import { AuthResponse } from "@calendar-todo/shared-types";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { RefreshTokenRequestDto } from "./dto/refresh-token-request.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({
    status: 201,
    description: "User successfully registered",
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid input data or password requirements not met",
    schema: {
      properties: {
        statusCode: { type: "number", example: 400 },
        message: {
          oneOf: [
            { type: "string", example: "Validation failed" },
            {
              type: "array",
              items: { type: "string" },
              example: ["Email must be a valid email", "Password is too weak"],
            },
          ],
        },
        error: { type: "string", example: "Bad Request" },
      },
    },
  })
  @ApiConflictResponse({
    description: "Email or username already exists",
    schema: {
      properties: {
        statusCode: { type: "number", example: 409 },
        message: { type: "string", example: "이미 가입된 이메일입니다" },
        error: { type: "string", example: "Conflict" },
      },
    },
  })
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
  ): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Invalid credentials",
    schema: {
      properties: {
        statusCode: { type: "number", example: 401 },
        message: { type: "string", example: "Invalid credentials" },
        error: { type: "string", example: "Unauthorized" },
      },
    },
  })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @CurrentUser() user: User,
  ): Promise<AuthResponse> {
    return this.authService.login(user, loginDto.rememberMe);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({
    status: 200,
    description: "Token successfully refreshed",
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid refresh token",
    schema: {
      properties: {
        statusCode: { type: "number", example: 400 },
        message: { type: "string", example: "Invalid refresh token" },
        error: { type: "string", example: "Bad Request" },
      },
    },
  })
  async refresh(
    @Body() refreshTokenRequest: RefreshTokenRequestDto,
  ): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenRequest.refreshToken);
  }

  @ApiBearerAuth("JWT-auth")
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({
    status: 200,
    description: "User successfully logged out",
    schema: {
      properties: {
        message: { type: "string", example: "Logged out successfully" },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT token",
    schema: {
      properties: {
        statusCode: { type: "number", example: 401 },
        message: { type: "string", example: "Unauthorized" },
      },
    },
  })
  logout(): { message: string } {
    return { message: "Logged out successfully" };
  }
}
