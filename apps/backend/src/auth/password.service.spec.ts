import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPassword123@';
      const hashedPassword = 'hashed-password';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'TestPassword123@';
      const hashedPassword = 'hashed-password';

      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'TestPassword123@';
      const hashedPassword = 'hashed-password';

      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return valid for strong password', () => {
      const strongPassword = 'TestPassword123@';

      const result = service.validatePasswordStrength(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid for password too short', () => {
      const shortPassword = 'Test1@';

      const result = service.validatePasswordStrength(shortPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should return invalid for password without lowercase letter', () => {
      const password = 'TESTPASSWORD123@';

      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should return invalid for password without uppercase letter', () => {
      const password = 'testpassword123@';

      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should return invalid for password without number', () => {
      const password = 'TestPassword@';

      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return invalid for password without special character', () => {
      const password = 'TestPassword123';

      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for weak password', () => {
      const weakPassword = 'test';

      const result = service.validatePasswordStrength(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should accept various special characters', () => {
      const passwordsWithSpecialChars = [
        'TestPassword123!',
        'TestPassword123@',
        'TestPassword123#',
        'TestPassword123$',
        'TestPassword123%',
        'TestPassword123^',
        'TestPassword123&',
        'TestPassword123*',
        'TestPassword123(',
        'TestPassword123)',
        'TestPassword123_',
        'TestPassword123+',
        'TestPassword123-',
        'TestPassword123=',
        'TestPassword123[',
        'TestPassword123]',
        'TestPassword123{',
        'TestPassword123}',
        'TestPassword123;',
        'TestPassword123:',
        "TestPassword123'",
        'TestPassword123"',
        'TestPassword123\\',
        'TestPassword123|',
        'TestPassword123,',
        'TestPassword123.',
        'TestPassword123<',
        'TestPassword123>',
        'TestPassword123/',
        'TestPassword123?',
      ];

      passwordsWithSpecialChars.forEach((password) => {
        const result = service.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should handle empty password', () => {
      const emptyPassword = '';

      const result = service.validatePasswordStrength(emptyPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(5);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should handle password with only spaces', () => {
      const spacePassword = '        ';

      const result = service.validatePasswordStrength(spacePassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });
});
