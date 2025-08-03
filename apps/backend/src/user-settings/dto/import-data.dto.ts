import { IsOptional, IsString, IsObject } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ImportDataDto {
  @ApiProperty({
    description: "데이터 포맷 버전",
    example: "1.0",
    required: false,
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({
    description: "내보내기 날짜",
    example: "2024-01-01T00:00:00.000Z",
    required: false,
  })
  @IsOptional()
  @IsString()
  exportDate?: string;

  @ApiProperty({
    description: "사용자 ID",
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: "사용자 설정 데이터",
    type: "object",
    additionalProperties: true,
  })
  @IsObject()
  settings: Record<string, unknown>;
}
