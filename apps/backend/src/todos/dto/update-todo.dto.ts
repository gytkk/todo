import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsObject,
  IsBoolean,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { TodoCategory } from "@calendar-todo/shared-types";

export class UpdateTodoDto {
  @ApiPropertyOptional({
    description: "할일 제목",
    example: "프로젝트 문서 작성 (수정됨)",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: "할일 상세 설명",
    example: "프로젝트 요구사항 문서를 작성하고 검토받기 (수정됨)",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "완료 여부",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({
    description: "우선순위",
    enum: ["high", "medium", "low"],
    example: "medium",
  })
  @IsOptional()
  @IsEnum(["high", "medium", "low"])
  priority?: "high" | "medium" | "low";

  @ApiPropertyOptional({
    description: "할일 카테고리",
    example: {
      id: "personal",
      name: "개인",
      color: "#4ECDC4",
      isDefault: false,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  })
  @IsOptional()
  @IsObject()
  category?: TodoCategory;

  @ApiPropertyOptional({
    description: "마감일 (ISO 8601 형식)",
    example: "2024-01-20T09:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
