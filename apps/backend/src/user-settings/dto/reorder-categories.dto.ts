import { IsArray, IsString, ArrayNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class ReorderCategoriesDto {
  @ApiProperty({
    description: "카테고리 ID 배열 (새로운 순서대로)",
    example: ["cat-1", "cat-2", "cat-3"],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Type(() => String)
  categoryIds: string[];
}
