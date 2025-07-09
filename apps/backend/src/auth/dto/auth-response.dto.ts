import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsBoolean, IsDateString } from 'class-validator';

export class UserResponseDto {
  @ApiProperty({ example: 'user-uuid-123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;


  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  createdAt: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}