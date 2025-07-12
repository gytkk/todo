import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { User } from "../users/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthResponse, RefreshTokenRequest } from "@calendar-todo/shared-types";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  // Spy function references
  let registerSpy: jest.SpyInstance;
  let loginSpy: jest.SpyInstance;
  let refreshTokenSpy: jest.SpyInstance;

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
    authService = module.get<AuthService>(AuthService);

    // Create spies for AuthService methods
    registerSpy = jest.spyOn(authService, "register");
    loginSpy = jest.spyOn(authService, "login");
    refreshTokenSpy = jest.spyOn(authService, "refreshToken");
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
      registerSpy.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(registerSpy).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it("should propagate registration errors", async () => {
      const error = new Error("이미 가입된 이메일입니다");
      registerSpy.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(error);
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "TestPassword123@",
    };

    it("should login user successfully", async () => {
      loginSpy.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, mockUser);

      expect(loginSpy).toHaveBeenCalledWith(mockUser, undefined);
      expect(result).toEqual(mockAuthResponse);
    });

    it("should handle login with different user", async () => {
      const differentUser = new User({ ...mockUser, id: "different-user-id" });
      const differentAuthResponse = {
        ...mockAuthResponse,
        user: { ...mockAuthResponse.user, id: "different-user-id" },
      };

      loginSpy.mockResolvedValue(differentAuthResponse);

      const result = await controller.login(loginDto, differentUser);

      expect(loginSpy).toHaveBeenCalledWith(differentUser, undefined);
      expect(result).toEqual(differentAuthResponse);
    });

    it("should propagate login errors", async () => {
      const error = new Error("Invalid credentials");
      loginSpy.mockRejectedValue(error);

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

      refreshTokenSpy.mockResolvedValue(newAuthResponse);

      const result = await controller.refresh(refreshTokenRequest);

      expect(refreshTokenSpy).toHaveBeenCalledWith("valid-refresh-token");
      expect(result).toEqual(newAuthResponse);
    });

    it("should propagate refresh errors", async () => {
      const error = new Error("Invalid refresh token");
      refreshTokenSpy.mockRejectedValue(error);

      await expect(controller.refresh(refreshTokenRequest)).rejects.toThrow(
        error,
      );
    });
  });

  describe("logout", () => {
    it("should return success message", () => {
      const result = controller.logout();

      expect(result).toEqual({ message: "Logged out successfully" });
    });

    it("should always succeed", () => {
      // Test multiple calls to ensure consistency
      const result1 = controller.logout();
      const result2 = controller.logout();

      expect(result1).toEqual({ message: "Logged out successfully" });
      expect(result2).toEqual({ message: "Logged out successfully" });
    });
  });
});
