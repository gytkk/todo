import { IsString, IsOptional, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UpdateUserRequest } from "@calendar-todo/shared-types";

export class UpdateUserDto implements UpdateUserRequest {
  @ApiProperty({
    description: "User name",
    example: "John Doe",
    required: false,
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "Name cannot be empty" })
  name?: string;
}
