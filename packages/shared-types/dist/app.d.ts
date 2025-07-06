export interface UserInfo {
    name: string;
    email: string;
    profileImage?: string;
}
export interface Category {
    id: string;
    name: string;
    color: string;
    isDefault: boolean;
}
export interface AppSettings {
    userInfo: UserInfo;
    categories: Category[];
    theme: 'light' | 'dark' | 'system';
    language: 'ko' | 'en';
    themeColor: string;
    customColor: string;
    defaultView: 'month' | 'week' | 'day';
    dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
    timeFormat: '12h' | '24h';
    timezone: string;
    weekStart: 'sunday' | 'monday' | 'saturday';
    oldTodoDisplayLimit: number;
    autoMoveTodos: boolean;
    saturationAdjustment: {
        enabled: boolean;
        levels: Array<{
            days: number;
            opacity: number;
        }>;
    };
    completedTodoDisplay: 'all' | 'yesterday' | 'none';
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
