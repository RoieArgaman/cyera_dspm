import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: IS_CI,
  retries: IS_CI ? 1 : 0,
  timeout: 90_000,
  workers: 1,
  reporter: IS_CI
    ? [
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['list'],
        [
          'allure-playwright',
          {
            detail: true,
            outputFolder: 'allure-results',
            suiteTitle: true,
            environmentInfo: {
              framework: 'playwright',
              browser: 'chromium',
              test_env: process.env.ENV ?? 'ci',
              base_url: BASE_URL,
            },
          },
        ],
      ]
    : [
        ['list'],
        ['html', { open: 'always' }],
        [
          'allure-playwright',
          {
            detail: true,
            outputFolder: 'allure-results',
            suiteTitle: true,
            environmentInfo: {
              framework: 'playwright',
              browser: 'chromium',
              test_env: process.env.ENV ?? 'local',
              base_url: BASE_URL,
            },
          },
        ],
      ],
  use: {
    testIdAttribute: 'data-testid',
    headless: false,
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'tests/auth.setup.ts',
      use: {
        browserName: 'chromium',
        headless: true,
      },
      teardown: 'teardown',
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
    },
  ],
});
