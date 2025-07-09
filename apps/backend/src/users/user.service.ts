import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { PasswordService } from '../auth/password.service';
import { User } from './user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserProfile } from '@calendar-todo/shared-types';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) { }

  async create(registerDto: RegisterDto): Promise<User> {
    const { email, password, name } = registerDto;

    // 이메일 중복 확인
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 가입된 이메일입니다');
    }


    // 비밀번호 강도 검사
    const passwordValidation = this.passwordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.errors);
    }

    // 비밀번호 해싱
    const passwordHash = await this.passwordService.hashPassword(password);

    // 사용자 생성
    const user = await this.userRepository.create({
      email,
      passwordHash,
      name,
      emailVerified: false,
      isActive: true,
    });

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserProfile> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }


    const updatedUser = await this.userRepository.update(id, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser.toProfile();
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await this.passwordService.comparePassword(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // 새 비밀번호 강도 검사
    const passwordValidation = this.passwordService.validatePasswordStrength(
      changePasswordDto.newPassword,
    );
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.errors);
    }

    // 새 비밀번호 해싱
    const newPasswordHash = await this.passwordService.hashPassword(changePasswordDto.newPassword);

    // 비밀번호 업데이트
    await this.userRepository.update(id, { passwordHash: newPasswordHash });
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await this.passwordService.comparePassword(password, user.passwordHash);
    return isPasswordValid ? user : null;
  }
}
