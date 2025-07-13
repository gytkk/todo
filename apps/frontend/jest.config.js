const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@calendar-todo/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@calendar-todo/ui$': '<rootDir>/../../packages/ui/src',
    // Mock @dnd-kit packages
    '^@dnd-kit/core$': '<rootDir>/src/__mocks__/@dnd-kit/core.ts',
    '^@dnd-kit/sortable$': '<rootDir>/src/__mocks__/@dnd-kit/sortable.ts',
    '^@dnd-kit/utilities$': '<rootDir>/src/__mocks__/@dnd-kit/utilities.ts',
  },
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.(ts|tsx)',
    '!src/app/**/*', // Exclude Next.js app directory
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)