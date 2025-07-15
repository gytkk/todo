/**
 * 임시 사용자 관리 유틸리티
 * 미인증 사용자를 위한 임시 식별자 생성 및 관리
 */

const TEMP_USER_KEY = 'temp-user-id';
const TEMP_USER_CREATED_AT_KEY = 'temp-user-created-at';
const TEMP_USER_LAST_ACCESS_KEY = 'temp-user-last-access';

// 임시 사용자 데이터 만료 기간 (30일)
const TEMP_USER_EXPIRY_DAYS = 30;

/**
 * 임시 사용자 정보 인터페이스
 */
export interface TempUserInfo {
  id: string;
  createdAt: Date;
  lastAccess: Date;
  daysRemaining: number;
  isExpired: boolean;
}

/**
 * 고유한 임시 사용자 ID 생성
 */
function generateTempUserId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `temp_${timestamp}_${random}`;
}

/**
 * 임시 사용자 ID 가져오기 또는 생성
 * 만료된 경우 새로 생성
 */
export function getTempUserId(): string {
  try {
    const existingId = localStorage.getItem(TEMP_USER_KEY);
    const createdAt = localStorage.getItem(TEMP_USER_CREATED_AT_KEY);
    
    if (existingId && createdAt) {
      const created = new Date(createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      
      // 만료되지 않은 경우 기존 ID 반환
      if (daysDiff < TEMP_USER_EXPIRY_DAYS) {
        // 마지막 접근 시간 업데이트
        localStorage.setItem(TEMP_USER_LAST_ACCESS_KEY, now.toISOString());
        return existingId;
      }
    }
    
    // 새로운 임시 사용자 생성
    return createTempUser();
  } catch {
    return createTempUser();
  }
}

/**
 * 새로운 임시 사용자 생성
 */
export function createTempUser(): string {
  try {
    const newId = generateTempUserId();
    const now = new Date().toISOString();
    
    localStorage.setItem(TEMP_USER_KEY, newId);
    localStorage.setItem(TEMP_USER_CREATED_AT_KEY, now);
    localStorage.setItem(TEMP_USER_LAST_ACCESS_KEY, now);
    
    return newId;
  } catch {
    // localStorage 접근 실패 시 세션 기반 ID 반환
    return generateTempUserId();
  }
}

/**
 * 임시 사용자 정보 조회
 */
export function getTempUserInfo(): TempUserInfo | null {
  try {
    const id = localStorage.getItem(TEMP_USER_KEY);
    const createdAt = localStorage.getItem(TEMP_USER_CREATED_AT_KEY);
    const lastAccess = localStorage.getItem(TEMP_USER_LAST_ACCESS_KEY);
    
    if (!id || !createdAt) {
      return null;
    }
    
    const created = new Date(createdAt);
    const lastAccessDate = lastAccess ? new Date(lastAccess) : created;
    const now = new Date();
    
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, TEMP_USER_EXPIRY_DAYS - daysSinceCreated);
    const isExpired = daysRemaining === 0;
    
    return {
      id,
      createdAt: created,
      lastAccess: lastAccessDate,
      daysRemaining,
      isExpired,
    };
  } catch {
    return null;
  }
}

/**
 * 임시 사용자 데이터 정리
 */
export function clearTempUser(): void {
  try {
    localStorage.removeItem(TEMP_USER_KEY);
    localStorage.removeItem(TEMP_USER_CREATED_AT_KEY);
    localStorage.removeItem(TEMP_USER_LAST_ACCESS_KEY);
  } catch {
    // Silent fail
  }
}

/**
 * 임시 사용자인지 확인
 */
export function isTempUser(userId?: string): boolean {
  if (!userId) return false;
  return userId.startsWith('temp_');
}

/**
 * 만료된 임시 사용자 데이터 자동 정리
 */
export function cleanupExpiredTempData(): void {
  try {
    const userInfo = getTempUserInfo();
    if (userInfo && userInfo.isExpired) {
      // 임시 사용자 데이터 정리
      clearTempUser();
      
      // 관련 로컬 스토리지 데이터도 정리
      const keysToRemove = [
        'local-todos',
        'local-todos_backup',
        'calendar-settings',
        'calendar-categories',
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Silent fail
        }
      });
    }
  } catch {
    // Silent fail
  }
}

/**
 * 임시 사용자 사용량 통계
 */
export function getTempUserUsageStats(): {
  totalDaysUsed: number;
  daysRemaining: number;
  usagePercentage: number;
} {
  const userInfo = getTempUserInfo();
  
  if (!userInfo) {
    return {
      totalDaysUsed: 0,
      daysRemaining: TEMP_USER_EXPIRY_DAYS,
      usagePercentage: 0,
    };
  }
  
  const totalDaysUsed = TEMP_USER_EXPIRY_DAYS - userInfo.daysRemaining;
  const usagePercentage = Math.round((totalDaysUsed / TEMP_USER_EXPIRY_DAYS) * 100);
  
  return {
    totalDaysUsed,
    daysRemaining: userInfo.daysRemaining,
    usagePercentage,
  };
}

/**
 * 앱 시작 시 임시 사용자 초기화
 */
export function initializeTempUser(): void {
  // 만료된 데이터 정리
  cleanupExpiredTempData();
  
  // 기존 임시 사용자가 있으면 마지막 접근 시간 업데이트
  const userInfo = getTempUserInfo();
  if (userInfo && !userInfo.isExpired) {
    localStorage.setItem(TEMP_USER_LAST_ACCESS_KEY, new Date().toISOString());
  }
}