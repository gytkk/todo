export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  findByIds(ids: string[]): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  findPaginated(options: PaginationOptions): Promise<PaginatedResult<T>>;
}

export interface UserScopedRepository<T extends { userId: string }> extends BaseRepository<T> {
  findByUserId(userId: string): Promise<T[]>;
  findByUserIdAndId(userId: string, id: string): Promise<T | null>;
  deleteByUserId(userId: string): Promise<boolean>;
  countByUserId(userId: string): Promise<number>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}