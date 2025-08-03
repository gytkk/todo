import {
  IsOptional,
  IsString,
  IsObject,
  IsIn,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  Min,
  Max,
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

  // 할일 관련 설정
  @ApiPropertyOptional({
    description: "미완료 작업 자동 이동 여부",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  autoMoveTodos?: boolean;

  @ApiPropertyOptional({
    description: "작업 이동 알림 표시 여부",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showTaskMoveNotifications?: boolean;

  @ApiPropertyOptional({
    description: "완료된 할일 표시 방식",
    enum: ["all", "yesterday", "none"],
    example: "yesterday",
  })
  @IsOptional()
  @IsString()
  @IsIn(["all", "yesterday", "none"])
  completedTodoDisplay?: "all" | "yesterday" | "none";

  // 캘린더 설정
  @ApiPropertyOptional({
    description: "날짜 형식",
    enum: ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"],
    example: "YYYY-MM-DD",
  })
  @IsOptional()
  @IsString()
  @IsIn(["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"])
  dateFormat?: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";

  @ApiPropertyOptional({
    description: "시간 형식",
    enum: ["12h", "24h"],
    example: "24h",
  })
  @IsOptional()
  @IsString()
  @IsIn(["12h", "24h"])
  timeFormat?: "12h" | "24h";

  @ApiPropertyOptional({
    description: "주 시작일",
    enum: ["sunday", "monday", "saturday"],
    example: "monday",
  })
  @IsOptional()
  @IsString()
  @IsIn(["sunday", "monday", "saturday"])
  weekStart?: "sunday" | "monday" | "saturday";

  // 알림 설정
  @ApiPropertyOptional({
    description: "알림 설정",
    example: {
      enabled: true,
      dailyReminder: false,
      weeklyReport: false,
    },
  })
  @IsOptional()
  @IsObject()
  notifications?: {
    enabled: boolean;
    dailyReminder: boolean;
    weeklyReport: boolean;
  };

  // 데이터 관리 설정
  @ApiPropertyOptional({
    description: "자동 백업 여부",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean;

  @ApiPropertyOptional({
    description: "백업 주기",
    enum: ["daily", "weekly", "monthly"],
    example: "weekly",
  })
  @IsOptional()
  @IsString()
  @IsIn(["daily", "weekly", "monthly"])
  backupInterval?: "daily" | "weekly" | "monthly";

  // 새로 추가된 설정들
  @ApiPropertyOptional({
    description: "프리셋 테마 색상",
    example: "#3b82f6",
  })
  @IsOptional()
  @IsString()
  themeColor?: string;

  @ApiPropertyOptional({
    description: "사용자 정의 색상",
    example: "#ff6b6b",
  })
  @IsOptional()
  @IsString()
  customColor?: string;

  @ApiPropertyOptional({
    description: "기본 캘린더 보기",
    enum: ["month", "week", "day"],
    example: "month",
  })
  @IsOptional()
  @IsString()
  @IsIn(["month", "week", "day"])
  defaultView?: "month" | "week" | "day";

  @ApiPropertyOptional({
    description: "타임존 설정",
    example: "Asia/Seoul",
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: "오래된 할일 표시 제한 (일 단위)",
    example: 14,
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  oldTodoDisplayLimit?: number;

  @ApiPropertyOptional({
    description: "포화도 조정 설정",
    example: {
      enabled: true,
      levels: [
        { days: 1, opacity: 0.9 },
        { days: 3, opacity: 0.7 },
        { days: 7, opacity: 0.5 },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  saturationAdjustment?: {
    enabled: boolean;
    levels: Array<{ days: number; opacity: number }>;
  };

  @ApiPropertyOptional({
    description: "주말 표시 여부",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showWeekends?: boolean;
}
