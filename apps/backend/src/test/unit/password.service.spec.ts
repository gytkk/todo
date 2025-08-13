import { PasswordService } from '../../services/password.service.js';

describe('PasswordService - Unit Tests', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('validate', () => {
    it('should return valid for a good password', () => {
      const result = passwordService.validate('ValidPassword123');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for empty password', () => {
      const result = passwordService.validate('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호를 입력해주세요');
    });

    it('should return invalid for password shorter than 6 characters', () => {
      const result = passwordService.validate('12345');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호는 최소 6자 이상이어야 합니다');
    });

    it('should return invalid for password longer than 100 characters', () => {
      const longPassword = 'a'.repeat(101);
      const result = passwordService.validate(longPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호는 100자 이하여야 합니다');
    });

    it('should return valid for minimum length password', () => {
      const result = passwordService.validate('123456');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for maximum length password', () => {
      const maxPassword = 'a'.repeat(100);
      const result = passwordService.validate(maxPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('hash and compare', () => {
    it('should hash password and verify correctly', async () => {
      const password = 'TestPassword123!';
      
      const hashedPassword = await passwordService.hash(password);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toContain('$2a$');
      
      const isValid = await passwordService.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      
      const hashedPassword = await passwordService.hash(password);
      const isValid = await passwordService.compare(wrongPassword, hashedPassword);
      
      expect(isValid).toBe(false);
    });
  });
});