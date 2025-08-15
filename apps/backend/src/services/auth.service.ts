import { FastifyInstance } from 'fastify';
import { UserPostgresRepository } from '../repositories/postgres/user.repository.js';
import { CategoryPostgresRepository } from '../repositories/postgres/category.repository.js';
import { PasswordService } from './password.service.js';
import { JwtService } from './jwt.service.js';
import { JwtPayload, UserProfile } from '@calendar-todo/shared-types';
import { User } from '@prisma/client';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export class AuthService {
  private userRepository: UserPostgresRepository;
  private categoryRepository: CategoryPostgresRepository;
  private passwordService: PasswordService;
  private jwtService: JwtService;

  constructor(private app: FastifyInstance) {
    this.userRepository = new UserPostgresRepository(app);
    this.categoryRepository = new CategoryPostgresRepository(app);
    this.passwordService = new PasswordService();
    this.jwtService = new JwtService(app);
  }

  async register(dto: RegisterDto): Promise<User> {
    // 이메일 중복 확인
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('이미 사용 중인 이메일입니다');
    }

    // 비밀번호 유효성 검사
    const passwordValidation = this.passwordService.validate(dto.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // 비밀번호 해시화
    const hashedPassword = await this.passwordService.hash(dto.password);

    // 사용자 생성
    const user = await this.userRepository.create({
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      name: dto.name,
    });

    // 기본 카테고리 생성
    await this.categoryRepository.create({
      name: '개인',
      color: '#3b82f6', // 기본 파란색
      icon: undefined,
      isDefault: true,
      order: 0,
      userId: user.id,
    });

    return user;
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    // 사용자 찾기
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 확인
    const isPasswordValid = await this.passwordService.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 계정 활성화 확인
    if (!user.isActive) {
      throw new Error('비활성화된 계정입니다');
    }

    // JWT 토큰 생성
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7일
    };

    const accessToken = await this.jwtService.sign(payload);
    const refreshToken = await this.jwtService.signRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage || undefined,
        emailVerified: false, // TODO: 이메일 검증 기능 추가 시 구현
        createdAt: user.createdAt,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Refresh 토큰 검증
      const payload = await this.jwtService.verify(refreshToken);

      // 사용자 확인
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      // 새 토큰 발급
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7일
      };

      const accessToken = await this.jwtService.sign(newPayload);
      const newRefreshToken = await this.jwtService.signRefreshToken(newPayload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage || undefined,
          emailVerified: false, // TODO: 이메일 검증 기능 추가 시 구현
          createdAt: user.createdAt,
        },
      };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async validateUser(id: string): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }
}