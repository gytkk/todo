import { FastifyInstance } from 'fastify';
import { UserPostgresRepository } from '../repositories/postgres/user.repository';
import { PasswordService } from './password.service';
import { User } from '@prisma/client';

export interface UpdateUserDto {
  name?: string;
  profileImage?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  private userRepository: UserPostgresRepository;
  private passwordService: PasswordService;

  constructor(private app: FastifyInstance) {
    this.userRepository = new UserPostgresRepository(app);
    this.passwordService = new PasswordService();
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }

    return await this.userRepository.update(id, dto);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await this.passwordService.compare(
      dto.currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new Error('현재 비밀번호가 올바르지 않습니다');
    }

    // 새 비밀번호 유효성 검사
    const passwordValidation = this.passwordService.validate(dto.newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // 새 비밀번호 해시화 및 업데이트
    const hashedPassword = await this.passwordService.hash(dto.newPassword);
    const updated = await this.userRepository.update(id, {
      password: hashedPassword,
    });

    return updated !== null;
  }

  async deactivateUser(id: string): Promise<boolean> {
    const updated = await this.userRepository.update(id, {
      isActive: false,
    });
    return updated !== null;
  }
}