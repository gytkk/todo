import { Test, TestingModule } from "@nestjs/testing";
import { PasswordService } from "./password.service";
import * as bcrypt from "bcrypt";

// Mock bcrypt
jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("PasswordService", () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("hashPassword", () => {
    it("should hash password with bcrypt", async () => {
      const password = "TestPassword123";
      const hashedPassword = "hashed-password";

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it("should hash password with correct salt rounds", async () => {
      const password = "TestPassword123";
      const hashedPassword = "hashed-password";

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      await service.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it("should return different hash for same password on multiple calls", async () => {
      const password = "TestPassword123";
      const hash1 = "hashed-password-1";
      const hash2 = "hashed-password-2";

      mockedBcrypt.hash
        .mockResolvedValueOnce(hash1 as never)
        .mockResolvedValueOnce(hash2 as never);

      const result1 = await service.hashPassword(password);
      const result2 = await service.hashPassword(password);

      expect(result1).toBe(hash1);
      expect(result2).toBe(hash2);
      expect(result1).not.toBe(result2);
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching passwords", async () => {
      const password = "TestPassword123";
      const hashedPassword = "hashed-password";

      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it("should return false for non-matching passwords", async () => {
      const wrongPassword = "WrongPassword123";
      const hashedPassword = "hashed-password";

      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.comparePassword(
        wrongPassword,
        hashedPassword,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        wrongPassword,
        hashedPassword,
      );
      expect(result).toBe(false);
    });

    it("should return false for empty password", async () => {
      const hashedPassword = "hashed-password";

      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.comparePassword("", hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith("", hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe("validatePasswordStrength", () => {
    describe("비밀번호 길이 검증", () => {
      it("should return valid for 8 character password", () => {
        const result = service.validatePasswordStrength("password");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return valid for password longer than 8 characters", () => {
        const result = service.validatePasswordStrength("password123");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return invalid for password shorter than 8 characters", () => {
        const result = service.validatePasswordStrength("pass123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password must be at least 8 characters long",
        );
      });

      it("should return invalid for empty password", () => {
        const result = service.validatePasswordStrength("");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password must be at least 8 characters long",
        );
      });
    });

    describe("비밀번호 문자 제한 검증", () => {
      it("should return valid for password with lowercase letters only", () => {
        const result = service.validatePasswordStrength("password");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return valid for password with uppercase letters only", () => {
        const result = service.validatePasswordStrength("PASSWORD");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return valid for password with numbers only", () => {
        const result = service.validatePasswordStrength("12345678");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return valid for password with mixed case letters and numbers", () => {
        const result = service.validatePasswordStrength("Password123");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return valid for password with basic special characters", () => {
        const result = service.validatePasswordStrength("Pass123!@#");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return valid for password with all allowed special characters", () => {
        const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
        const result = service.validatePasswordStrength(
          `Pass123${specialChars}`,
        );
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return valid for password with spaces", () => {
        const result = service.validatePasswordStrength("My Password 123");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return invalid for password with Korean characters", () => {
        const result = service.validatePasswordStrength("Password한글123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password can only contain English letters, numbers, and basic special characters",
        );
      });

      it("should return invalid for password with Chinese characters", () => {
        const result = service.validatePasswordStrength("Password中文123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password can only contain English letters, numbers, and basic special characters",
        );
      });

      it("should return invalid for password with Japanese characters", () => {
        const result = service.validatePasswordStrength("Passwordひらがな123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password can only contain English letters, numbers, and basic special characters",
        );
      });

      it("should return invalid for password with emoji", () => {
        const result = service.validatePasswordStrength("Password123😊");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password can only contain English letters, numbers, and basic special characters",
        );
      });

      it("should return invalid for password with extended ASCII characters", () => {
        const result = service.validatePasswordStrength("Password123ñ");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password can only contain English letters, numbers, and basic special characters",
        );
      });

      it("should return invalid for password with tab character", () => {
        const result = service.validatePasswordStrength("Password\t123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password can only contain English letters, numbers, and basic special characters",
        );
      });

      it("should return invalid for password with newline character", () => {
        const result = service.validatePasswordStrength("Password\n123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password can only contain English letters, numbers, and basic special characters",
        );
      });
    });

    describe("복합 검증 테스트", () => {
      it("should return both length and character errors for short password with invalid characters", () => {
        const result = service.validatePasswordStrength("한글123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain(
          "Password must be at least 8 characters long",
        );
        expect(result.errors).toContain(
          "Password can only contain English letters, numbers, and basic special characters",
        );
      });

      it("should return only character error for long password with invalid characters", () => {
        const result = service.validatePasswordStrength("한글비밀번호123456");
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors).toContain(
          "Password can only contain English letters, numbers, and basic special characters",
        );
      });

      it("should return only length error for short password with valid characters", () => {
        const result = service.validatePasswordStrength("Pass123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors).toContain(
          "Password must be at least 8 characters long",
        );
      });

      it("should return valid for password meeting all requirements", () => {
        const result = service.validatePasswordStrength("ValidPassword123!");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe("엣지 케이스 테스트", () => {
      it("should handle password with only spaces (8 characters)", () => {
        const result = service.validatePasswordStrength("        ");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should handle password with only spaces (less than 8 characters)", () => {
        const result = service.validatePasswordStrength("   ");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password must be at least 8 characters long",
        );
      });

      it("should handle very long valid password", () => {
        const longPassword = "a".repeat(100);
        const result = service.validatePasswordStrength(longPassword);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should handle password with all different character types", () => {
        const result = service.validatePasswordStrength("AaBbCc123!@#");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
