import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginRequest } from '@calendar-todo/shared-types';

export class LoginDto implements LoginRequest {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}