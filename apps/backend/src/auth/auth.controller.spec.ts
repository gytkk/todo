import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { User } from "../users/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthResponse, RefreshTokenRequest } from "@calendar-todo/shared-types";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = new User({
    id: "test-user-id",
    email: "test@example.com",
    name: "John Doe",
    passwordHash: "hashed-password",
    emailVerified: false,
    isActive: true,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  });

  const mockAuthResponse: AuthResponse = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "John Doe",
      emailVerified: false,
      createdAt: new Date("2023-01-01"),
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register", () => {
    const registerDto: RegisterDto = {
      email: "test@example.com",
      password: "TestPassword123@",
      name: "John Doe",
    };

    it("should register a new user successfully", async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it("should propagate registration errors", async () => {
      const error = new Error("이미 가입된 이메일입니다");
      authService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(error);
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "TestPassword123@",
    };

    it("should login user successfully", async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, mockUser);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthResponse);
    });

    it("should handle login with different user", async () => {
      const differentUser = new User({ ...mockUser, id: "different-user-id" });
      const differentAuthResponse = {
        ...mockAuthResponse,
        user: { ...mockAuthResponse.user, id: "different-user-id" },
      };

      authService.login.mockResolvedValue(differentAuthResponse);

      const result = await controller.login(loginDto, differentUser);

      expect(authService.login).toHaveBeenCalledWith(differentUser);
      expect(result).toEqual(differentAuthResponse);
    });

    it("should propagate login errors", async () => {
      const error = new Error("Invalid credentials");
      authService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto, mockUser)).rejects.toThrow(error);
    });
  });

  describe("refresh", () => {
    const refreshTokenRequest: RefreshTokenRequest = {
      refreshToken: "valid-refresh-token",
    };

    it("should refresh tokens successfully", async () => {
      const newAuthResponse: AuthResponse = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        user: mockAuthResponse.user,
      };

      authService.refreshToken.mockResolvedValue(newAuthResponse);

      const result = await controller.refresh(refreshTokenRequest);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        "valid-refresh-token",
      );
      expect(result).toEqual(newAuthResponse);
    });

    it("should propagate refresh errors", async () => {
      const error = new Error("Invalid refresh token");
      authService.refreshToken.mockRejectedValue(error);

      await expect(controller.refresh(refreshTokenRequest)).rejects.toThrow(
        error,
      );
    });
  });

  describe("logout", () => {
    it("should return success message", async () => {
      const result = await controller.logout();

      expect(result).toEqual({ message: "Logged out successfully" });
    });

    it("should always succeed", async () => {
      // Test multiple calls to ensure consistency
      const result1 = await controller.logout();
      const result2 = await controller.logout();

      expect(result1).toEqual({ message: "Logged out successfully" });
      expect(result2).toEqual({ message: "Logged out successfully" });
    });
  });
});
