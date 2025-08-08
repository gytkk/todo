import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import {
  BaseRepository,
  PaginatedResult,
  PaginationOptions,
} from './interfaces/repository.interface';

export abstract class BasePostgresRepository<T extends { id: string }>
  implements BaseRepository<T>
{
  protected prisma: PrismaClient;
  protected abstract tableName: string;
  
  constructor(protected app: FastifyInstance) {
    this.prisma = app.prisma;
  }

  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract create(entity: Partial<T>): Promise<T>;
  abstract update(id: string, updates: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;
  abstract exists(id: string): Promise<boolean>;

  async findByIds(ids: string[]): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }
    
    // Default implementation - subclasses should override for optimization
    const results = await Promise.all(
      ids.map(id => this.findById(id))
    );
    
    return results.filter(item => item !== null) as T[];
  }

  async findPaginated(options: PaginationOptions): Promise<PaginatedResult<T>> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    // This is a generic implementation - subclasses should override
    // for specific table optimizations
    const items = await this.findAll();
    const total = items.length;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
  }

  // Helper method for transaction support
  protected async withTransaction<R>(
    callback: (tx: PrismaClient) => Promise<R>
  ): Promise<R> {
    return this.prisma.$transaction(callback);
  }

  // Helper method for counting records
  protected async count(): Promise<number> {
    // Subclasses should implement table-specific counting
    throw new Error('count method must be implemented by subclass');
  }
}