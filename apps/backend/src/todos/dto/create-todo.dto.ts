import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { TodoCategoryDto } from "./todo-category.dto";

export class CreateTodoDto {
  @ApiProperty({
    description: "할일 제목",
    example: "프로젝트 문서 작성",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: "할일 상세 설명",
    example: "프로젝트 요구사항 문서를 작성하고 검토받기",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "우선순위",
    enum: ["high", "medium", "low"],
    example: "high",
  })
  @IsOptional()
  @IsEnum(["high", "medium", "low"])
  priority?: "high" | "medium" | "low";

  @ApiProperty({
    description: "할일 카테고리 정보",
    type: TodoCategoryDto,
  })
  @ValidateNested()
  @Type(() => TodoCategoryDto)
  @IsNotEmpty()
  category: TodoCategoryDto;

  @ApiProperty({
    description: "할일 날짜 (ISO 8601 형식)",
    example: "2024-01-15T09:00:00.000Z",
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}
