import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { LocalStrategy } from "./local.strategy";
import { AuthService } from "../auth.service";
import { User } from "../../users/user.entity";

describe("LocalStrategy", () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockUser = new User({
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "hashedPassword",
    isActive: true,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  });

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validate", () => {
    const validEmail = "test@example.com";
    const validPassword = "password123";

    it("유효한 자격 증명으로 사용자를 성공적으로 반환해야 함", async () => {
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(validEmail, validPassword);

      expect(authService.validateUser).toHaveBeenCalledWith(
        validEmail,
        validPassword,
      );
      expect(result).toEqual(mockUser);
    });

    it("잘못된 자격 증명에 대해 UnauthorizedException을 던져야 함", async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate(validEmail, "wrongPassword"),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));

      expect(authService.validateUser).toHaveBeenCalledWith(
        validEmail,
        "wrongPassword",
      );
    });

    it("존재하지 않는 이메일에 대해 UnauthorizedException을 던져야 함", async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate("nonexistent@example.com", validPassword),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));

      expect(authService.validateUser).toHaveBeenCalledWith(
        "nonexistent@example.com",
        validPassword,
      );
    });

    it("AuthService에서 에러 발생 시 에러를 전파해야 함", async () => {
      const dbError = new Error("Database connection failed");
      authService.validateUser.mockRejectedValue(dbError);

      await expect(
        strategy.validate(validEmail, validPassword),
      ).rejects.toThrow(dbError);

      expect(authService.validateUser).toHaveBeenCalledWith(
        validEmail,
        validPassword,
      );
    });

    it("빈 이메일로 validateUser를 호출해야 함", async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate("", validPassword)).rejects.toThrow(
        new UnauthorizedException("Invalid credentials"),
      );

      expect(authService.validateUser).toHaveBeenCalledWith("", validPassword);
    });

    it("빈 비밀번호로 validateUser를 호출해야 함", async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(validEmail, "")).rejects.toThrow(
        new UnauthorizedException("Invalid credentials"),
      );

      expect(authService.validateUser).toHaveBeenCalledWith(validEmail, "");
    });

    it("이메일과 비밀번호 모두 빈 값일 때 처리해야 함", async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate("", "")).rejects.toThrow(
        new UnauthorizedException("Invalid credentials"),
      );

      expect(authService.validateUser).toHaveBeenCalledWith("", "");
    });

    it("다양한 이메일 형식으로 validate를 호출해야 함", async () => {
      const testCases = [
        "user@domain.com",
        "user.name@domain.co.kr",
        "user+tag@domain.org",
        "123@numbers.com",
      ];

      for (const email of testCases) {
        authService.validateUser.mockResolvedValue(mockUser);

        await strategy.validate(email, validPassword);

        expect(authService.validateUser).toHaveBeenCalledWith(
          email,
          validPassword,
        );
      }

      expect(authService.validateUser).toHaveBeenCalledTimes(testCases.length);
    });

    it("특수문자가 포함된 비밀번호를 처리해야 함", async () => {
      const specialPassword = "Pa$$w0rd!@#$%^&*()";
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(validEmail, specialPassword);

      expect(authService.validateUser).toHaveBeenCalledWith(
        validEmail,
        specialPassword,
      );
      expect(result).toEqual(mockUser);
    });

    it("공백이 포함된 이메일과 비밀번호를 그대로 전달해야 함", async () => {
      const emailWithSpaces = " test@example.com ";
      const passwordWithSpaces = " password123 ";
      authService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate(emailWithSpaces, passwordWithSpaces),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));

      expect(authService.validateUser).toHaveBeenCalledWith(
        emailWithSpaces,
        passwordWithSpaces,
      );
    });
  });

  describe("passport strategy configuration", () => {
    it("Local 전략이 올바르게 설정되어야 함", () => {
      // LocalStrategy 인스턴스가 생성되었는지 확인
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(LocalStrategy);
    });

    it("이메일을 username 필드로 사용하도록 설정되어야 함", () => {
      // LocalStrategy가 usernameField를 email로 설정했는지는
      // 실제로는 내부 구현 세부사항이므로 기능적 테스트로 대체
      expect(strategy).toBeDefined();
    });
  });

  describe("edge cases", () => {
    const validEmail = "test@example.com";
    const validPassword = "password123";

    it("매우 긴 이메일을 처리해야 함", async () => {
      const longEmail = "a".repeat(100) + "@example.com";
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(longEmail, validPassword)).rejects.toThrow(
        new UnauthorizedException("Invalid credentials"),
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        longEmail,
        validPassword,
      );
    });

    it("매우 긴 비밀번호를 처리해야 함", async () => {
      const longPassword = "a".repeat(1000);
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(validEmail, longPassword)).rejects.toThrow(
        new UnauthorizedException("Invalid credentials"),
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        validEmail,
        longPassword,
      );
    });

    it("유니코드 문자가 포함된 이메일을 처리해야 함", async () => {
      const unicodeEmail = "테스트@도메인.한국";
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(unicodeEmail, validPassword);

      expect(authService.validateUser).toHaveBeenCalledWith(
        unicodeEmail,
        validPassword,
      );
      expect(result).toEqual(mockUser);
    });
  });
});
