import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './user.entity';
import { UserProfile } from '@calendar-todo/shared-types';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getProfile(@CurrentUser() user: User): UserProfile {
    return user.toProfile();
  }

  @Put('me')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<UserProfile> {
    return this.userService.update(userId, updateUserDto);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.userService.changePassword(userId, changePasswordDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser('id') userId: string): Promise<void> {
    await this.userService.delete(userId);
  }
}