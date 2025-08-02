// 사용자 설정 관련 타입들
export interface UserCategoryData {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  order?: number;
}

export interface UserSettingsData {
  categories: UserCategoryData[];
  categoryFilter: { [categoryId: string]: boolean };
  theme: "light" | "dark" | "system";
  language: string;
  
  // 할일 관련 설정
  autoMoveTodos: boolean;
  showTaskMoveNotifications: boolean;
  completedTodoDisplay: "all" | "yesterday" | "none";
  
  // 캘린더 설정
  dateFormat: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  timeFormat: "12h" | "24h";
  weekStart: "sunday" | "monday" | "saturday";
  
  // 알림 설정
  notifications: {
    enabled: boolean;
    dailyReminder: boolean;
    weeklyReport: boolean;
  };
  
  // 데이터 관리 설정
  autoBackup: boolean;
  backupInterval: "daily" | "weekly" | "monthly";
}

// 사용자 관련 타입들
export interface User {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
  emailVerified: boolean;
  createdAt: Date;
}

// JWT 관련 타입들
export interface JwtPayload {
  sub: string; // 사용자 ID
  email: string;
  iat: number;
  exp: number;
}

// 인증 요청/응답 DTO들
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  userSettings: UserSettingsData;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateUserRequest {
  name?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileResponse {
  user: UserProfile;
}

// 에러 응답 타입들
export interface AuthError {
  statusCode: number;
  message: string;
  error: string;
}

export interface ValidationError {
  statusCode: number;
  message: string[];
  error: string;
}