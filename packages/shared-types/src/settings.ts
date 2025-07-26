// 사용자 정보 타입
export interface UserInfo {
  name: string;
  email: string;
  profileImage?: string;
}

// 카테고리 타입
export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

// 앱 설정 관련 타입들
export interface AppSettings {
  // 사용자 정보
  userInfo: UserInfo;

  // 카테고리 관리
  categories: Category[];

  // 보기 설정
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  themeColor: string;
  customColor: string;
  defaultView: 'month' | 'week' | 'day';

  // 캘린더 설정
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  timeFormat: '12h' | '24h';
  timezone: string;
  weekStart: 'sunday' | 'monday' | 'saturday';

  // 할 일 설정
  oldTodoDisplayLimit: number;
  autoMoveTodos: boolean;
  saturationAdjustment: {
    enabled: boolean;
    levels: Array<{ days: number; opacity: number }>;
  };
  completedTodoDisplay: 'all' | 'yesterday' | 'none';

  // 기존 설정 (호환성 유지)
  showWeekends: boolean;
  autoBackup: boolean;
  backupInterval: 'daily' | 'weekly' | 'monthly';
}