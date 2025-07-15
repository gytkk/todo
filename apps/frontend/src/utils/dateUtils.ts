import { format, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday as isDateToday, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

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
   * 단순 날짜 포맷팅 (캘린더 컴포넌트용)
   */
  simple: (date: Date, formatStr: string): string => {
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
    return isSameDay(date1, date2);
  },

  /**
   * 날짜가 오늘인지 확인
   */
  isToday: (date: Date): boolean => {
    return isDateToday(date);
  },

  /**
   * 안전한 Date 객체 생성 (문자열이나 Date 객체 모두 처리)
   */
  ensureDate: (date: Date | string): Date => {
    return date instanceof Date ? date : new Date(date);
  },
};

/**
 * 캘린더 관련 유틸리티 함수들
 */
export const calendarUtils = {
  /**
   * 캘린더 월 뷰에 표시할 날짜들 생성
   */
  getCalendarDates: (year: number, month: number): Date[] => {
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = endOfMonth(firstOfMonth);
    const firstOfWeek = startOfWeek(firstOfMonth, { weekStartsOn: 0 });
    const lastOfWeek = endOfWeek(lastOfMonth, { weekStartsOn: 0 });

    return eachDayOfInterval({
      start: firstOfWeek,
      end: lastOfWeek,
    });
  },

  /**
   * 주 뷰에 표시할 날짜들 생성
   */
  getWeekDates: (date: Date): Date[] => {
    const startOfWeekDate = startOfWeek(date, { weekStartsOn: 0 });
    const endOfWeekDate = endOfWeek(date, { weekStartsOn: 0 });

    return eachDayOfInterval({
      start: startOfWeekDate,
      end: endOfWeekDate,
    });
  },

  /**
   * 현재 달인지 확인
   */
  isCurrentMonth: (date: Date, currentDate: Date): boolean => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  },

  /**
   * 월 네비게이션
   */
  navigateMonth: (date: Date, direction: 'prev' | 'next'): Date => {
    return direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
  },

  /**
   * 주 네비게이션
   */
  navigateWeek: (date: Date, direction: 'prev' | 'next'): Date => {
    return direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1);
  },

  /**
   * 일 네비게이션
   */
  navigateDay: (date: Date, direction: 'prev' | 'next'): Date => {
    return direction === 'prev' ? subDays(date, 1) : addDays(date, 1);
  },

  /**
   * 년월 포맷팅
   */
  getMonthYear: (date: Date): string => {
    return format(date, 'yyyy년 M월', { locale: ko });
  },

  /**
   * 주 범위 포맷팅
   */
  getWeekRange: (date: Date): string => {
    const startOfWeekDate = startOfWeek(date, { weekStartsOn: 0 });
    const endOfWeekDate = endOfWeek(date, { weekStartsOn: 0 });

    if (startOfWeekDate.getMonth() === endOfWeekDate.getMonth()) {
      return format(startOfWeekDate, 'yyyy년 M월 d일', { locale: ko }) + ' - ' + format(endOfWeekDate, 'd일', { locale: ko });
    } else {
      return format(startOfWeekDate, 'yyyy년 M월 d일', { locale: ko }) + ' - ' + format(endOfWeekDate, 'M월 d일', { locale: ko });
    }
  },

  /**
   * 일 이름 포맷팅
   */
  getDayName: (date: Date): string => {
    return format(date, 'yyyy년 M월 d일 (EEEE)', { locale: ko });
  },

  /**
   * 요일 이름 배열
   */
  getWeekdayNames: (): string[] => {
    return ['일', '월', '화', '수', '목', '금', '토'];
  },
};