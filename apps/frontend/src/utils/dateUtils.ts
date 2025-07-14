import { format } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * 공통 날짜 포맷팅 유틸리티
 */
export const formatDate = {
  /**
   * "MM월 dd일" 형식으로 포맷팅 (예: "12월 25일")
   */
  monthDay: (date: Date): string => {
    return format(date, "MM월 dd일", { locale: ko });
  },

  /**
   * "MM월 dd일 (E)" 형식으로 포맷팅 (예: "12월 25일 (월)")
   */
  monthDayWeek: (date: Date): string => {
    return format(date, "MM월 dd일 (E)", { locale: ko });
  },

  /**
   * "yyyy년 MM월 dd일" 형식으로 포맷팅 (예: "2024년 12월 25일")
   */
  fullDate: (date: Date): string => {
    return format(date, "yyyy년 MM월 dd일", { locale: ko });
  },

  /**
   * 커스텀 포맷으로 포맷팅
   */
  custom: (date: Date, formatStr: string): string => {
    return format(date, formatStr, { locale: ko });
  },

  /**
   * ISO 문자열로 변환
   */
  toISO: (date: Date): string => {
    return date.toISOString();
  },

  /**
   * ISO 문자열에서 Date 객체로 변환
   */
  fromISO: (isoString: string): Date => {
    return new Date(isoString);
  },
};

/**
 * 날짜 비교 유틸리티
 */
export const dateUtils = {
  /**
   * 두 날짜가 같은 날인지 확인
   */
  isSameDay: (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  },

  /**
   * 날짜가 오늘인지 확인
   */
  isToday: (date: Date): boolean => {
    return dateUtils.isSameDay(date, new Date());
  },

  /**
   * 안전한 Date 객체 생성 (문자열이나 Date 객체 모두 처리)
   */
  ensureDate: (date: Date | string): Date => {
    return date instanceof Date ? date : new Date(date);
  },
};