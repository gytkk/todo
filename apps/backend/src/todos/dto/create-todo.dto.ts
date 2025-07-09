import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TodoCategory } from '@calendar-todo/shared-types';

export class CreateTodoDto {
  @ApiProperty({
    description: '할일 제목',
    example: '프로젝트 문서 작성',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: '할일 상세 설명',
    example: '프로젝트 요구사항 문서를 작성하고 검토받기',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '우선순위',
    enum: ['high', 'medium', 'low'],
    example: 'high',
  })
  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  priority?: 'high' | 'medium' | 'low';

  @ApiProperty({
    description: '할일 카테고리',
    example: {
      id: 'work',
      name: '업무',
      color: '#FF6B6B',
      isDefault: false,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  })
  @IsObject()
  @IsNotEmpty()
  category: TodoCategory;

  @ApiProperty({
    description: '마감일 (ISO 8601 형식)',
    example: '2024-01-15T09:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}