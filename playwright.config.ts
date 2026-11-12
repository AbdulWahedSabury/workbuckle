import { defineConfig, devices } from '@playwright/test';

// Browser tests run a production build against a throwaway local database.
// Storage and SMTP point at unreachable local ports, so nothing is uploaded to
// Supabase and no email leaves the machine, whatever .env contains.
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgresql://abdulwahedsabury@127.0.0.1:5432/workbuckle_e2e';
const PORT = 3100;

export const E2E_ENV = {
  DATABASE_URL: E2E_DATABASE_URL,
  DIRECT_URL: E2E_DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
  SUPABASE_SERVICE_ROLE_KEY: 'e2e-invalid-key',
  EMAIL_HOST: '127.0.0.1',
  EMAIL_PORT: '9',
  EMAIL_SECURE: 'false',
  AUTH_TRUST_HOST: 'true',
  NODE_ENV: 'production',
};

Object.assign(process.env, { DATABASE_URL: E2E_DATABASE_URL, DIRECT_URL: E2E_DATABASE_URL });

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // The scenarios build on each other's data (hire → capacity → closed job).
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, dependencies: ['desktop'] },
  ],
  webServer: {
    // Requires `next build` with the same env first (see tests/README.md).
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/admin/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: E2E_ENV,
  },
});
