import { TestHelper } from './setup';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://todouser:todopass123@localhost:5432/todoapp_test?schema=public';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.ENABLE_SWAGGER = 'false';

// Global test setup
let testHelper: TestHelper;

beforeAll(async () => {
  testHelper = TestHelper.getInstance();
  await testHelper.beforeAll();
});

afterAll(async () => {
  await testHelper.afterAll();
});

// Export for use in tests
export { testHelper };