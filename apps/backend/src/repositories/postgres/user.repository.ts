import { User, Prisma } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { BasePostgresRepository } from '../base-postgres.repository.js';
import { CreateUserDto } from '../../entities/user.entity.js';
import { PaginatedResult, PaginationOptions } from '../interfaces/repository.interface.js';

export class UserPostgresRepository extends BasePostgresRepository<User> {
  protected tableName = 'users';

  constructor(app: FastifyInstance) {
    super(app);
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error finding all users:', error);
      return [];
    }
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      return await this.prisma.user.findMany({
        where: {
          id: { in: ids },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error finding users by ids:', error);
      return [];
    }
  }

  async create(userData: CreateUserDto): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          profileImage: userData.profileImage,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      return await this.prisma.user.update({
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
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({
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
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });
      return user !== null;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  async findPaginated(options: PaginationOptions): Promise<PaginatedResult<User>> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    try {
      const [items, total] = await Promise.all([
        this.prisma.user.findMany({
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count(),
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
      console.error('Error finding paginated users:', error);
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

  async updatePassword(id: string, hashedPassword: string): Promise<User | null> {
    return this.update(id, { password: hashedPassword });
  }

  async updateProfile(id: string, profileData: Partial<Pick<User, 'name' | 'profileImage'>>): Promise<User | null> {
    return this.update(id, profileData);
  }

  async setActive(id: string, isActive: boolean): Promise<User | null> {
    return this.update(id, { isActive });
  }

  protected async count(where?: Prisma.UserWhereInput): Promise<number> {
    try {
      return await this.prisma.user.count({ where });
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }
}