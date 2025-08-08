import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export class DatabaseService {
  private static instance: PrismaClient;
  
  static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
      });
    }
    return DatabaseService.instance;
  }

  static async connect(): Promise<PrismaClient> {
    const prisma = DatabaseService.getInstance();
    
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL connected successfully');
      return prisma;
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
      console.log('✅ PostgreSQL disconnected');
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const prisma = DatabaseService.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL health check failed:', error);
      return false;
    }
  }
}