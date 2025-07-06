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
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export type HttpStatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 500 | 502 | 503;
