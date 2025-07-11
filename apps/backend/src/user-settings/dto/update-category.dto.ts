import { IsString, IsOptional, Matches } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: "카테고리 이름",
    example: "프로젝트 (수정됨)",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "카테고리 색상 (헥스 코드)",
    example: "#8b5cf6",
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: "색상은 유효한 헥스 코드여야 합니다 (예: #8b5cf6)",
  })
  color?: string;
}
