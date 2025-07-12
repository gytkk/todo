import {
  IsOptional,
  IsString,
  IsObject,
  IsIn,
  IsNotEmpty,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: "테마 설정",
    enum: ["light", "dark", "system"],
    example: "dark",
  })
  @IsOptional()
  @IsString()
  @IsIn(["light", "dark", "system"])
  theme?: "light" | "dark" | "system";

  @ApiPropertyOptional({
    description: "언어 설정",
    example: "ko",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  language?: string;

  @ApiPropertyOptional({
    description: "카테고리 필터 설정",
    example: { "category-id-1": true, "category-id-2": false },
  })
  @IsOptional()
  @IsObject()
  categoryFilter?: { [categoryId: string]: boolean };
}
