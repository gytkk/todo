import { AuthService, RegisterDto, LoginDto } from '../../services/auth.service.js';
import { UserPostgresRepository } from '../../repositories/postgres/user.repository.js';
import { PasswordService } from '../../services/password.service.js';
import { FastifyInstance } from 'fastify';
import { createMockApp } from '../mocks/prisma.mock.js';
import { mockDeep } from 'jest-mock-extended';

// Jest globals are now available through setup

// Mock modules - handled by jest automatically in ESM

describe('AuthService - Unit Tests', () => {
  let authService: AuthService;
  let mockApp: FastifyInstance;
  let mockUserRepository: jest.Mocked<UserPostgresRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;

  beforeEach(() => {
    mockApp = createMockApp();
    
    // Create AuthService instance
    authService = new AuthService(mockApp);
    
    // Replace internal repositories with deep mocks
    mockUserRepository = mockDeep<UserPostgresRepository>();
    mockPasswordService = mockDeep<PasswordService>();
    
    // Inject the mocks into the auth service
    (authService as unknown as { userRepository: UserPostgresRepository }).userRepository = mockUserRepository;
    (authService as unknown as { passwordService: PasswordService }).passwordService = mockPasswordService;
  });

  afterEach(() => {
    // Mock cleanup handled by jest-mock-extended
  });

  describe('register', () => {
    const validRegisterDto: RegisterDto = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
      name: 'Test User'
    };

    it('should register a new user successfully', async () => {
      // Arrange
      const hashedPassword = '$2a$10$hashedpassword';
      const createdUser = {
        id: 'user-id',
        email: validRegisterDto.email,
        name: validRegisterDto.name,
        password: hashedPassword,
        profileImage: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({ isValid: true, errors: [] });
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await authService.register(validRegisterDto);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRegisterDto.email);
      expect(mockPasswordService.validate).toHaveBeenCalledWith(validRegisterDto.password);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(validRegisterDto.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: validRegisterDto.email.toLowerCase(),
        password: hashedPassword,
        name: validRegisterDto.name
      });
      expect(result).toEqual(createdUser);
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      const invalidDto = { ...validRegisterDto, password: '123' };
      mockPasswordService.validate.mockReturnValue({
        isValid: false,
        errors: ['비밀번호는 최소 6자 이상이어야 합니다']
      });

      // Act & Assert
      await expect(authService.register(invalidDto)).rejects.toThrow('비밀번호는 최소 6자 이상이어야 합니다');
      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for existing email', async () => {
      // Arrange
      const existingUser = {
        id: 'existing-id',
        email: validRegisterDto.email,
        password: 'hashedpassword',
        name: 'Existing User',
        profileImage: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(authService.register(validRegisterDto)).rejects.toThrow('이미 사용 중인 이메일입니다');
      expect(mockPasswordService.validate).not.toHaveBeenCalled();
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const validLoginDto: LoginDto = {
      email: 'test@example.com',
      password: 'ValidPassword123!'
    };

    const mockUser = {
      id: 'user-id',
      email: validLoginDto.email,
      password: '$2a$10$hashedpassword',
      name: 'Test User',
      profileImage: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      const expectedTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      
      // Mock JwtService methods through app instance
      const mockJwtService = mockDeep<{
        sign: (payload: object, options?: object) => Promise<string>;
        signRefreshToken: (payload: object, options?: object) => Promise<string>;
      }>();
      mockJwtService.sign.mockResolvedValue(expectedTokens.accessToken);
      mockJwtService.signRefreshToken.mockResolvedValue(expectedTokens.refreshToken);
      (authService as unknown as { jwtService: typeof mockJwtService }).jwtService = mockJwtService;

      // Act
      const result = await authService.login(validLoginDto);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validLoginDto.email);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(validLoginDto.password, mockUser.password);
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockJwtService.signRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', expectedTokens.accessToken);
      expect(result).toHaveProperty('refreshToken', expectedTokens.refreshToken);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        profileImage: undefined,
        emailVerified: false,
        createdAt: mockUser.createdAt
      });
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(validLoginDto)).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다');
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(validLoginDto)).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다');
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);
      mockPasswordService.compare.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.login(validLoginDto)).rejects.toThrow('비활성화된 계정입니다');
      expect(mockPasswordService.compare).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const validRefreshToken = 'valid-refresh-token';
    const mockPayload = {
      sub: 'user-id',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
      name: 'Test User',
      profileImage: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should refresh token successfully', async () => {
      // Arrange
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      const mockJwtService = mockDeep<{
        verify: (token: string) => Promise<object>;
        sign: (payload: object, options?: object) => Promise<string>;
        signRefreshToken: (payload: object, options?: object) => Promise<string>;
      }>();
      mockJwtService.verify.mockResolvedValue(mockPayload);
      mockJwtService.sign.mockResolvedValue(newAccessToken);
      mockJwtService.signRefreshToken.mockResolvedValue(newRefreshToken);
      (authService as unknown as { jwtService: typeof mockJwtService }).jwtService = mockJwtService;
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await authService.refreshToken(validRefreshToken);

      // Assert
      expect(mockJwtService.verify).toHaveBeenCalledWith(validRefreshToken);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockPayload.sub);
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockJwtService.signRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', newAccessToken);
      expect(result).toHaveProperty('refreshToken', newRefreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const mockJwtService = mockDeep<{
        verify: (token: string) => Promise<object>;
      }>();
      mockJwtService.verify.mockRejectedValue(new Error('Invalid token'));
      (authService as unknown as { jwtService: typeof mockJwtService }).jwtService = mockJwtService;

      // Act & Assert
      await expect(authService.refreshToken(validRefreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      const mockJwtService = mockDeep<{
        verify: (token: string) => Promise<object>;
      }>();
      mockJwtService.verify.mockResolvedValue(mockPayload);
      (authService as unknown as { jwtService: typeof mockJwtService }).jwtService = mockJwtService;
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.refreshToken(validRefreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('validateUser', () => {
    const userId = 'user-id';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
      name: 'Test User',
      profileImage: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return user for valid and active user', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await authService.validateUser(userId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await authService.validateUser(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      // Act
      const result = await authService.validateUser(userId);

      // Assert
      expect(result).toBeNull();
    });
  });
});