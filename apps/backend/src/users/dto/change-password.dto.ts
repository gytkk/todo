import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChangePasswordRequest } from '@calendar-todo/shared-types';

export class ChangePasswordDto implements ChangePasswordRequest {
  @ApiProperty({
    description: 'Current user password',
    example: 'CurrentPass123@',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description:
      'New password (minimum 8 characters, must contain uppercase, lowercase, number and special character)',
    example: 'NewSecurePass123@',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;
}
