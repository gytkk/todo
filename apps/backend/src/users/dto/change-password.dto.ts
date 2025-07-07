import { IsString, MinLength, Matches } from 'class-validator';
import { ChangePasswordRequest } from '@calendar-todo/shared-types';

export class ChangePasswordDto implements ChangePasswordRequest {
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;
}