import { ApiProperty } from "@nestjs/swagger";
import { TodoItem, TodoStats } from "@calendar-todo/shared-types";

export class TodoResponseDto {
  @ApiProperty({
    description: "할일 아이템",
    example: {
      id: "abc123",
      title: "프로젝트 문서 작성",
      date: "2024-01-15T09:00:00.000Z",
      completed: false,
      category: {
        id: "work",
        name: "업무",
        color: "#FF6B6B",
        isDefault: false,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      userId: "user123",
    },
  })
  todo: TodoItem;
}

export class TodoListResponseDto {
  @ApiProperty({
    description: "할일 목록",
    type: [TodoResponseDto],
  })
  todos: TodoItem[];

  @ApiProperty({
    description: "할일 통계",
    example: {
      total: 10,
      completed: 4,
      incomplete: 6,
      completionRate: 40,
      recentCompletions: 2,
    },
  })
  stats: TodoStats;
}

export class TodoStatsResponseDto {
  @ApiProperty({
    description: "할일 통계",
    example: {
      total: 10,
      completed: 4,
      incomplete: 6,
      completionRate: 40,
      recentCompletions: 2,
    },
  })
  stats: TodoStats;
}

export class DeleteTodoResponseDto {
  @ApiProperty({
    description: "삭제 성공 여부",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "삭제된 할일 ID",
    example: "abc123",
  })
  deletedId: string;
}
