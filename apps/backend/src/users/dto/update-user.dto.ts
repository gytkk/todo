import { IsString, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateUserRequest } from '@calendar-todo/shared-types';

export class UpdateUserDto implements UpdateUserRequest {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'First name cannot be empty' })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Last name cannot be empty' })
  lastName?: string;

  @ApiProperty({
    description: 'Username (letters, numbers and underscores only)',
    example: 'johndoe123',
    required: false,
    minLength: 3,
    pattern: '^[a-zA-Z0-9_]+$',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers and underscores',
  })
  username?: string;
}