export interface Event {
    title?: string;
    allDay?: boolean;
    start?: Date;
    end?: Date;
    resource?: unknown;
}
export interface TodoCategory {
    id: string;
    name: string;
    color: string;
    icon?: string;
    isDefault: boolean;
    createdAt: Date;
}
export interface CategoryFilter {
    [categoryId: string]: boolean;
}
export interface TodoItem {
    id: string;
    title: string;
    date: Date;
    completed: boolean;
    category: TodoCategory;
    userId?: string;
}
export interface SavedTodoItem {
    id: string;
    title: string;
    date: string;
    completed: boolean;
    category: TodoCategory;
    userId?: string;
}
export interface CalendarEvent extends Event {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: TodoItem;
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
export interface CreateTodoRequest {
    title: string;
    date: string;
    categoryId: string;
}
export interface CreateTodoResponse {
    todo: TodoItem;
}
export interface UpdateTodoRequest {
    title?: string;
    completed?: boolean;
    date?: string;
    categoryId?: string;
}
export interface UpdateTodoResponse {
    todo: TodoItem;
}
export interface GetTodosResponse {
    todos: TodoItem[];
    stats: TodoStats;
}
export interface DeleteTodoResponse {
    success: boolean;
    deletedId: string;
}
export type CategoryAction = 'deleted' | 'moved' | 'cancelled';
