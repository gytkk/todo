export interface BaseRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  exists(id: ID): Promise<boolean>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedRepository<T, ID = string>
  extends BaseRepository<T, ID> {
  findPaginated(options: PaginationOptions): Promise<PaginatedResult<T>>;
}

export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}

export interface UserScopedRepository<T, ID = string>
  extends BaseRepository<T, ID> {
  findByUserId(userId: string): Promise<T[]>;
  findByUserIdAndId(userId: string, id: ID): Promise<T | null>;
  deleteByUserId(userId: string): Promise<boolean>;
  countByUserId(userId: string): Promise<number>;
}
