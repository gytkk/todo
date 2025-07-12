import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { LoginRequest } from "@calendar-todo/shared-types";

export class LoginDto implements LoginRequest {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
    format: "email",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @ApiProperty({
    description: "User password",
    example: "MySecurePass123@",
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: "Password is required" })
  password: string;

  @ApiProperty({
    description: "Keep user logged in for extended period",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
