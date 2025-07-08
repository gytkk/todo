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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './user.entity';
import { UserProfile } from '@calendar-todo/shared-types';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-id-123' },
        email: { type: 'string', example: 'user@example.com' },
        username: { type: 'string', example: 'johndoe', nullable: true },
        firstName: { type: 'string', example: 'John', nullable: true },
        lastName: { type: 'string', example: 'Doe', nullable: true },
        profileImage: { type: 'string', nullable: true },
        emailVerified: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  getProfile(@CurrentUser() user: User): UserProfile {
    return user.toProfile();
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Updated user profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-id-123' },
        email: { type: 'string', example: 'user@example.com' },
        username: { type: 'string', example: 'johndoe', nullable: true },
        firstName: { type: 'string', example: 'John', nullable: true },
        lastName: { type: 'string', example: 'Doe', nullable: true },
        profileImage: { type: 'string', nullable: true },
        emailVerified: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Validation failed' },
            { type: 'array', items: { type: 'string' }, example: ['First name cannot be empty'] },
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<UserProfile> {
    return this.userService.update(userId, updateUserDto);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change user password' })
  @ApiNoContentResponse({
    description: 'Password successfully changed',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or current password incorrect',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Current password is incorrect' },
            {
              type: 'array',
              items: { type: 'string' },
              example: ['New password must be at least 8 characters long'],
            },
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.userService.changePassword(userId, changePasswordDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user account' })
  @ApiNoContentResponse({
    description: 'Account successfully deleted',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async deleteAccount(@CurrentUser('id') userId: string): Promise<void> {
    await this.userService.delete(userId);
  }
}
