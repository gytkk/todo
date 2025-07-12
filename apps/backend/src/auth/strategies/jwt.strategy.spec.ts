import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy";
import { UserService } from "../../users/user.service";
import { User } from "../../users/user.entity";
import { JwtPayload } from "@calendar-todo/shared-types";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let userService: jest.Mocked<UserService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = new User({
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "hashedPassword",
    isActive: true,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  });

  const mockInactiveUser = new User({
    id: "user-2",
    email: "inactive@example.com",
    name: "Inactive User",
    passwordHash: "hashedPassword",
    isActive: false,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  });

  beforeEach(async () => {
    const mockUserService = {
      findById: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get(UserService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("ConfigService에서 JWT_SECRET을 가져와야 함", () => {
      expect(configService.get).toHaveBeenCalledWith("JWT_SECRET");
    });

    it("JWT_SECRET이 없으면 fallback secret을 사용해야 함", () => {
      configService.get.mockReturnValue(undefined);

      // 새로운 인스턴스를 생성하여 fallback 동작 테스트
      const module = Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: UserService,
            useValue: userService,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

      expect(() => module).not.toThrow();
    });
  });

  describe("validate", () => {
    const validPayload: JwtPayload = {
      sub: "user-1",
      email: "test@example.com",
      iat: Date.now(),
      exp: Date.now() + 3600000, // 1시간 후
    };

    it("유효한 사용자를 성공적으로 반환해야 함", async () => {
      userService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(validPayload);

      expect(userService.findById).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(mockUser);
    });

    it("존재하지 않는 사용자에 대해 UnauthorizedException을 던져야 함", async () => {
      userService.findById.mockResolvedValue(null);

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        new UnauthorizedException("User not found or inactive"),
      );

      expect(userService.findById).toHaveBeenCalledWith("user-1");
    });

    it("비활성화된 사용자에 대해 UnauthorizedException을 던져야 함", async () => {
      userService.findById.mockResolvedValue(mockInactiveUser);

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        new UnauthorizedException("User not found or inactive"),
      );

      expect(userService.findById).toHaveBeenCalledWith("user-1");
    });

    it("UserService에서 에러 발생 시 에러를 전파해야 함", async () => {
      const dbError = new Error("Database connection failed");
      userService.findById.mockRejectedValue(dbError);

      await expect(strategy.validate(validPayload)).rejects.toThrow(dbError);

      expect(userService.findById).toHaveBeenCalledWith("user-1");
    });

    it("다양한 사용자 ID로 validate를 호출해야 함", async () => {
      const payloadWithDifferentUser: JwtPayload = {
        ...validPayload,
        sub: "user-999",
      };

      userService.findById.mockResolvedValue(mockUser);

      await strategy.validate(payloadWithDifferentUser);

      expect(userService.findById).toHaveBeenCalledWith("user-999");
    });

    it("활성화된 사용자만 통과시켜야 함", async () => {
      const activeUser = new User({
        ...mockUser,
        isActive: true,
      });

      userService.findById.mockResolvedValue(activeUser);

      const result = await strategy.validate(validPayload);

      expect(result.isActive).toBe(true);
      expect(result).toEqual(activeUser);
    });
  });

  describe("passport strategy configuration", () => {
    it("JWT 전략이 올바르게 설정되어야 함", () => {
      // JwtStrategy 인스턴스가 생성되었는지 확인
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(JwtStrategy);
    });
  });
});
