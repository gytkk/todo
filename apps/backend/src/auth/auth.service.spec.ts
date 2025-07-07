import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { JwtAuthService } from './jwt.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtAuthService: jest.Mocked<JwtAuthService>;

  const mockUser = new User({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: 'hashed-password',
    emailVerified: false,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  });

  const mockAuthResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: mockUser.toProfile(),
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
      verifyRefreshToken: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtAuthService = module.get(JwtAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'TestPassword123@',
      firstName: 'John',
      lastName: 'Doe',
      username: 'testuser',
    };

    it('should register a new user and return auth response', async () => {
      userService.create.mockResolvedValue(mockUser);
      jwtAuthService.generateAccessToken.mockReturnValue('access-token');
      jwtAuthService.generateRefreshToken.mockReturnValue('refresh-token');

      const result = await service.register(registerDto);

      expect(userService.create).toHaveBeenCalledWith(registerDto);
      expect(jwtAuthService.generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(jwtAuthService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should propagate error from user creation', async () => {
      const error = new Error('Email already exists');
      userService.create.mockRejectedValue(error);

      await expect(service.register(registerDto)).rejects.toThrow(error);
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      userService.validatePassword.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(userService.validatePassword).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should return null if credentials are invalid', async () => {
      userService.validatePassword.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'wrong-password');

      expect(userService.validatePassword).toHaveBeenCalledWith('test@example.com', 'wrong-password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate tokens for valid user', async () => {
      jwtAuthService.generateAccessToken.mockReturnValue('access-token');
      jwtAuthService.generateRefreshToken.mockReturnValue('refresh-token');

      const result = await service.login(mockUser);

      expect(jwtAuthService.generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(jwtAuthService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens for valid refresh token', async () => {
      jwtAuthService.verifyRefreshToken.mockReturnValue({
        sub: 'test-user-id',
        type: 'refresh',
      });
      userService.findById.mockResolvedValue(mockUser);
      jwtAuthService.generateAccessToken.mockReturnValue('new-access-token');
      jwtAuthService.generateRefreshToken.mockReturnValue('new-refresh-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(jwtAuthService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(userService.findById).toHaveBeenCalledWith('test-user-id');
      expect(jwtAuthService.generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(jwtAuthService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: mockUser.toProfile(),
      });
    });

    it('should throw error for invalid refresh token', async () => {
      jwtAuthService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-refresh-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user not found', async () => {
      jwtAuthService.verifyRefreshToken.mockReturnValue({
        sub: 'non-existent-user-id',
        type: 'refresh',
      });
      userService.findById.mockResolvedValue(null);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user is inactive', async () => {
      const inactiveUser = new User({ ...mockUser, isActive: false });
      jwtAuthService.verifyRefreshToken.mockReturnValue({
        sub: 'test-user-id',
        type: 'refresh',
      });
      userService.findById.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toThrow('Invalid refresh token');
    });
  });
});