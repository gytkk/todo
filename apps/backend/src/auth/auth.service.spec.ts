import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UserService } from "../users/user.service";
import { JwtAuthService } from "./jwt.service";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { User } from "../users/user.entity";
import { RegisterDto } from "./dto/register.dto";

describe("AuthService", () => {
  let service: AuthService;
  let userService: UserService;
  let jwtAuthService: JwtAuthService;
  let userSettingsService: UserSettingsService;

  // Spy function references
  let createSpy: jest.SpyInstance;
  let validatePasswordSpy: jest.SpyInstance;
  let findByIdSpy: jest.SpyInstance;
  let generateTokenPairSpy: jest.SpyInstance;
  let verifyRefreshTokenSpy: jest.SpyInstance;
  let refreshAccessTokenSpy: jest.SpyInstance;
  let getUserSettingsSpy: jest.SpyInstance;

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

  const mockUserSettings = {
    categories: [
      {
        id: "cat-1",
        name: "개인",
        color: "#3b82f6",
        createdAt: new Date("2023-01-01"),
        order: 0,
      },
    ],
    categoryFilter: { "cat-1": true },
    theme: "system" as const,
    language: "ko",
    autoMoveTodos: true,
    showTaskMoveNotifications: true,
    completedTodoDisplay: "yesterday" as const,
    dateFormat: "YYYY-MM-DD" as const,
    timeFormat: "24h" as const,
    weekStart: "monday" as const,
    notifications: {
      enabled: true,
      dailyReminder: false,
      weeklyReport: false,
    },
    autoBackup: false,
    backupInterval: "weekly" as const,
  };

  const mockAuthResponse = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: mockUser.toProfile(),
    userSettings: mockUserSettings,
  };

  beforeEach(async () => {
    const mockUserService = {
      create: jest.fn(),
      validatePassword: jest.fn(),
      findById: jest.fn(),
    };

    const mockJwtAuthService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      generateTokenPair: jest.fn(),
      verifyRefreshToken: jest.fn(),
      refreshAccessToken: jest.fn(),
    };

    const mockUserSettingsService = {
      getUserSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtAuthService,
          useValue: mockJwtAuthService,
        },
        {
          provide: UserSettingsService,
          useValue: mockUserSettingsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService);
    userSettingsService = module.get<UserSettingsService>(UserSettingsService);

    // Create spies for UserService methods
    createSpy = jest.spyOn(userService, "create");
    validatePasswordSpy = jest.spyOn(userService, "validatePassword");
    findByIdSpy = jest.spyOn(userService, "findById");

    // Create spies for JwtAuthService methods
    generateTokenPairSpy = jest.spyOn(jwtAuthService, "generateTokenPair");
    verifyRefreshTokenSpy = jest.spyOn(jwtAuthService, "verifyRefreshToken");
    refreshAccessTokenSpy = jest.spyOn(jwtAuthService, "refreshAccessToken");

    // Create spy for UserSettingsService methods
    getUserSettingsSpy = jest.spyOn(userSettingsService, "getUserSettings");

    // Default mock implementation
    getUserSettingsSpy.mockResolvedValue(mockUserSettings);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    const registerDto: RegisterDto = {
      email: "test@example.com",
      password: "TestPassword123@",
      name: "John Doe",
    };

    it("should register a new user and return auth response with userSettings", async () => {
      createSpy.mockResolvedValue(mockUser);
      generateTokenPairSpy.mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const result = await service.register(registerDto);

      expect(createSpy).toHaveBeenCalledWith(registerDto);
      expect(generateTokenPairSpy).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        false,
      );
      expect(getUserSettingsSpy).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockAuthResponse);
      expect(result.userSettings).toBeDefined();
    });

    it("should propagate error from user creation", async () => {
      const error = new Error("이미 가입된 이메일입니다");
      createSpy.mockRejectedValue(error);

      await expect(service.register(registerDto)).rejects.toThrow(error);
    });

    it("should handle userSettings service error gracefully", async () => {
      createSpy.mockResolvedValue(mockUser);
      generateTokenPairSpy.mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      getUserSettingsSpy.mockRejectedValue(new Error("Settings service error"));

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe("validateUser", () => {
    it("should return user if credentials are valid", async () => {
      validatePasswordSpy.mockResolvedValue(mockUser);

      const result = await service.validateUser("test@example.com", "password");

      expect(validatePasswordSpy).toHaveBeenCalledWith(
        "test@example.com",
        "password",
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null if credentials are invalid", async () => {
      validatePasswordSpy.mockResolvedValue(null);

      const result = await service.validateUser(
        "test@example.com",
        "wrong-password",
      );

      expect(validatePasswordSpy).toHaveBeenCalledWith(
        "test@example.com",
        "wrong-password",
      );
      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should generate tokens for valid user with userSettings", async () => {
      generateTokenPairSpy.mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const result = await service.login(mockUser);

      expect(generateTokenPairSpy).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        false,
      );
      expect(getUserSettingsSpy).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockAuthResponse);
      expect(result.userSettings).toBeDefined();
    });

    it("should pass rememberMe flag to generateTokenPair", async () => {
      generateTokenPairSpy.mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await service.login(mockUser, true);

      expect(generateTokenPairSpy).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        true,
      );
    });
  });

  describe("refreshToken", () => {
    it("should generate new tokens for valid refresh token with userSettings", async () => {
      refreshAccessTokenSpy.mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      verifyRefreshTokenSpy.mockReturnValue({
        sub: "test-user-id",
        type: "refresh",
      });
      findByIdSpy.mockResolvedValue(mockUser);

      const result = await service.refreshToken("valid-refresh-token");

      expect(refreshAccessTokenSpy).toHaveBeenCalledWith("valid-refresh-token");
      expect(verifyRefreshTokenSpy).toHaveBeenCalledWith("new-refresh-token");
      expect(findByIdSpy).toHaveBeenCalledWith("test-user-id");
      expect(getUserSettingsSpy).toHaveBeenCalledWith("test-user-id");
      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        user: mockUser.toProfile(),
        userSettings: mockUserSettings,
      });
      expect(result.userSettings).toBeDefined();
    });

    it("should throw error for invalid refresh token", async () => {
      verifyRefreshTokenSpy.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(
        service.refreshToken("invalid-refresh-token"),
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should throw error if user not found", async () => {
      refreshAccessTokenSpy.mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      verifyRefreshTokenSpy.mockReturnValue({
        sub: "non-existent-user-id",
        type: "refresh",
      });
      findByIdSpy.mockResolvedValue(null);

      await expect(service.refreshToken("valid-refresh-token")).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should throw error if user is inactive", async () => {
      const inactiveUser = new User({ ...mockUser, isActive: false });
      refreshAccessTokenSpy.mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      verifyRefreshTokenSpy.mockReturnValue({
        sub: "test-user-id",
        type: "refresh",
      });
      findByIdSpy.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken("valid-refresh-token")).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should handle userSettings service error during refresh", async () => {
      refreshAccessTokenSpy.mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      verifyRefreshTokenSpy.mockReturnValue({
        sub: "test-user-id",
        type: "refresh",
      });
      findByIdSpy.mockResolvedValue(mockUser);
      getUserSettingsSpy.mockRejectedValue(new Error("Settings service error"));

      await expect(
        service.refreshToken("valid-refresh-token"),
      ).rejects.toThrow();
    });
  });
});
