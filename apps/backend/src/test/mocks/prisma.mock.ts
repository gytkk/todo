import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { FastifyInstance } from 'fastify';
import { SignOptions } from '@fastify/jwt';
import { JwtPayload } from '@calendar-todo/shared-types';

// Jest globals are now available through setup

// Create a mock Prisma client
export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
};

export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
  };
};

export const mockContext = createMockContext();

beforeEach(() => {
  mockReset(mockContext.prisma);
});

// Create a mock Fastify app for unit tests
export const createMockApp = (): FastifyInstance => {
  const mockApp = {
    prisma: mockDeep<PrismaClient>(),
    jwt: mockDeep<{
      sign: (payload: object, options?: SignOptions) => Promise<string>;
      verify: (token: string) => Promise<JwtPayload>;
    }>(),
  } as unknown as FastifyInstance;

  return mockApp;
};
