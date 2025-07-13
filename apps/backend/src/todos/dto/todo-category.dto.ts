import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TodoCategoryDto {
  @ApiProperty({
    description: "카테고리 ID",
    example: "work",
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: "카테고리 이름",
    example: "회사",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "카테고리 색상 (헥스 코드)",
    example: "#3b82f6",
  })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: "색상은 유효한 헥스 코드여야 합니다 (예: #3b82f6)",
  })
  color: string;

  @ApiPropertyOptional({
    description: "카테고리 아이콘",
    example: "work",
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: "생성 날짜 (ISO 8601 형식)",
    example: "2024-01-01T00:00:00.000Z",
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: "카테고리 순서",
    example: 0,
  })
  @IsNumber()
  order: number;
}
