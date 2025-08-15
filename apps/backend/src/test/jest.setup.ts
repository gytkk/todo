// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://todouser:todopass123@localhost:5432/todoapp_test?schema=public';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
process.env.ENABLE_SWAGGER = 'false';

// For unit tests, don't initialize database
// Unit tests should mock all database interactions

// Jest globals are available in test environment

// Mock console methods to avoid noise in test output
global.console = {
  ...console,
  error: () => {}, // Mock console.error to avoid error logs in tests
  warn: () => {},  // Mock console.warn to avoid warning logs in tests
};