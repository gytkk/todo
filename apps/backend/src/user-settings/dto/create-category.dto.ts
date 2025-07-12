import { IsString, IsNotEmpty, Matches, Length } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCategoryDto {
  @ApiProperty({
    description: "카테고리 이름",
    example: "프로젝트",
  })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @ApiProperty({
    description: "카테고리 색상 (헥스 코드)",
    example: "#ef4444",
  })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: "색상은 유효한 헥스 코드여야 합니다 (예: #ef4444)",
  })
  color: string;
}
