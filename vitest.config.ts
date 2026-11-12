import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Integration tests run against a throwaway local database, never the one in .env.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://abdulwahedsabury@127.0.0.1:5432/workbuckle_test';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      // Next.js resolves this at build time; outside Next it is a no-op.
      'server-only': path.resolve(__dirname, 'tests/setup/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['tests/setup/guard-database.ts', 'tests/setup/integration-mocks.ts'],
    // EMAIL_USER only names the sender; the mailer itself is a fake (tests/setup/integration-mocks.ts).
    env: { DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: TEST_DATABASE_URL, EMAIL_USER: 'noreply@test.local' },
    // One shared database: run files one at a time.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
