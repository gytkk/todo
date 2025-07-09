import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterRequest } from '@calendar-todo/shared-types';

export class RegisterDto implements RegisterRequest {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters, English letters, numbers, and basic special characters only)',
    example: 'MySecurePass123',
    minLength: 8,
    pattern: '^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?`~ ]+$',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~ ]+$/, {
    message: 'Password can only contain English letters, numbers, and basic special characters',
  })
  password: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name: string;

}
