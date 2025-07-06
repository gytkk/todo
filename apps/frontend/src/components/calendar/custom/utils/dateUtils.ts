import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday as isDateToday, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export const isToday = (date: Date): boolean => {
  return isDateToday(date);
};

export const isSameDate = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

export const formatDate = (date: Date, formatStr: string): string => {
  return format(date, formatStr, { locale: ko });
};

export const getCalendarDates = (year: number, month: number): Date[] => {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = endOfMonth(firstOfMonth);
  const firstOfWeek = startOfWeek(firstOfMonth, { weekStartsOn: 0 }); // 일요일 시작
  const lastOfWeek = endOfWeek(lastOfMonth, { weekStartsOn: 0 });

  return eachDayOfInterval({
    start: firstOfWeek,
    end: lastOfWeek,
  });
};

export const getWeekDates = (date: Date): Date[] => {
  const startOfWeekDate = startOfWeek(date, { weekStartsOn: 0 });
  const endOfWeekDate = endOfWeek(date, { weekStartsOn: 0 });

  return eachDayOfInterval({
    start: startOfWeekDate,
    end: endOfWeekDate,
  });
};

export const isCurrentMonth = (date: Date, currentDate: Date): boolean => {
  return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
};

export const navigateMonth = (date: Date, direction: 'prev' | 'next'): Date => {
  return direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
};

export const navigateWeek = (date: Date, direction: 'prev' | 'next'): Date => {
  return direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1);
};

export const navigateDay = (date: Date, direction: 'prev' | 'next'): Date => {
  return direction === 'prev' ? subDays(date, 1) : addDays(date, 1);
};

export const getMonthYear = (date: Date): string => {
  return formatDate(date, 'yyyy년 M월');
};

export const getWeekRange = (date: Date): string => {
  const startOfWeekDate = startOfWeek(date, { weekStartsOn: 0 });
  const endOfWeekDate = endOfWeek(date, { weekStartsOn: 0 });
  
  if (startOfWeekDate.getMonth() === endOfWeekDate.getMonth()) {
    return formatDate(startOfWeekDate, 'yyyy년 M월 d일') + ' - ' + formatDate(endOfWeekDate, 'd일');
  } else {
    return formatDate(startOfWeekDate, 'yyyy년 M월 d일') + ' - ' + formatDate(endOfWeekDate, 'M월 d일');
  }
};

export const getDayName = (date: Date): string => {
  return formatDate(date, 'yyyy년 M월 d일 (EEEE)');
};

export const getWeekdayNames = (): string[] => {
  return ['일', '월', '화', '수', '목', '금', '토'];
};