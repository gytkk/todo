import { Event } from "react-big-calendar";

export interface TodoItem {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
}

export interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: TodoItem;
}

export interface SavedTodoItem {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  timeFormat: '12h' | '24h';
  weekStart: 'sunday' | 'monday' | 'saturday';
  defaultView: 'month' | 'week' | 'day';
  showWeekends: boolean;
  autoBackup: boolean;
  backupInterval: 'daily' | 'weekly' | 'monthly';
}

export type PageType = "home" | "statistics" | "settings";

export interface SidebarState {
  expanded: boolean;
  visible: boolean;
}

export interface CalendarState {
  selectedDate: Date | undefined;
  isSidebarOpen: boolean;
}

export interface TodoFormData {
  title: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  incomplete: number;
  completionRate: number;
  recentCompletions: number;
}