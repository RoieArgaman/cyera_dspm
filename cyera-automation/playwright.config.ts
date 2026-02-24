import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'tests/auth.setup.ts',
      use: {
        browserName: 'chromium',
      },
    },
    {
      name: 'ui',
      testMatch: 'tests/ui/**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        browserName: 'chromium',
        storageState: '.auth/session.json',
      },
    },
    {
      name: 'api',
      testMatch: 'tests/api/**/*.spec.ts',
      dependencies: ['setup'],
    },
    {
      name: 'teardown',
      testMatch: 'tests/teardown.setup.ts',
      dependencies: ['ui', 'api'],
    },
  ],
});
