import { Category, Prisma } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { BasePostgresRepository } from '../base-postgres.repository.js';
import { PaginatedResult, PaginationOptions } from '../interfaces/repository.interface.js';

export interface CreateCategoryDto {
  name: string;
  color: string;
  icon?: string;
  isDefault?: boolean;
  order?: number;
  userId: string;
}

export class CategoryPostgresRepository extends BasePostgresRepository<Category> {
  protected tableName = 'categories';

  constructor(app: FastifyInstance) {
    super(app);
  }

  async findById(id: string): Promise<Category | null> {
    try {
      return await this.prisma.category.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error finding category by id:', error);
      return null;
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      return await this.prisma.category.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      console.error('Error finding all categories:', error);
      return [];
    }
  }

  async findByUserId(userId: string): Promise<Category[]> {
    try {
      return await this.prisma.category.findMany({
        where: { userId },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      console.error('Error finding categories by user id:', error);
      return [];
    }
  }

  async findByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      return await this.prisma.category.findMany({
        where: {
          id: { in: ids },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      console.error('Error finding categories by ids:', error);
      return [];
    }
  }

  async create(categoryData: CreateCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.create({
        data: {
          name: categoryData.name,
          color: categoryData.color,
          icon: categoryData.icon,
          isDefault: categoryData.isDefault ?? false,
          order: categoryData.order ?? 0,
          userId: categoryData.userId,
        },
      });
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  }

  async update(id: string, updates: Partial<Category>): Promise<Category | null> {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: updates,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          return null;
        }
      }
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.category.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          return false;
        }
      }
      console.error('Error deleting category:', error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        select: { id: true },
      });
      return category !== null;
    } catch (error) {
      console.error('Error checking category existence:', error);
      return false;
    }
  }

  async findPaginated(options: PaginationOptions & { userId?: string }): Promise<PaginatedResult<Category>> {
    const { page, limit, userId } = options;
    const offset = (page - 1) * limit;

    try {
      const whereClause = userId ? { userId } : {};
      
      const [items, total] = await Promise.all([
        this.prisma.category.findMany({
          where: whereClause,
          skip: offset,
          take: limit,
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        }),
        this.prisma.category.count({ where: whereClause }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      };
    } catch (error) {
      console.error('Error finding paginated categories:', error);
      return {
        items: [],
        total: 0,
        page,
        limit,
        hasNext: false,
        hasPrev: false,
      };
    }
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Category | null> {
    try {
      return await this.prisma.category.findUnique({
        where: {
          userId_name: {
            userId,
            name,
          },
        },
      });
    } catch (error) {
      console.error('Error finding category by name and user id:', error);
      return null;
    }
  }

  async getDefaultCategory(userId: string): Promise<Category | null> {
    try {
      return await this.prisma.category.findFirst({
        where: {
          userId,
          isDefault: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      console.error('Error finding default category:', error);
      return null;
    }
  }

  async setAsDefault(id: string, userId: string): Promise<Category | null> {
    try {
      return await this.withTransaction(async (tx) => {
        // First, unset all default categories for the user
        await tx.category.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });

        // Then set the specified category as default
        return tx.category.update({
          where: { id },
          data: { isDefault: true },
        });
      });
    } catch (error) {
      console.error('Error setting category as default:', error);
      return null;
    }
  }

  async reorderCategories(userId: string, categoryOrders: Array<{ id: string; order: number }>): Promise<boolean> {
    try {
      await this.withTransaction(async (tx) => {
        for (const { id, order } of categoryOrders) {
          await tx.category.update({
            where: { id, userId }, // Ensure user owns the category
            data: { order },
          });
        }
      });
      return true;
    } catch (error) {
      console.error('Error reordering categories:', error);
      return false;
    }
  }

  protected async count(where?: Prisma.CategoryWhereInput): Promise<number> {
    try {
      return await this.prisma.category.count({ where });
    } catch (error) {
      console.error('Error counting categories:', error);
      return 0;
    }
  }
}