import { test as base, expect, type TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ApiClient } from '../src/api/ApiClient';
import { WebApp } from '../src/web/WebApp';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:8080';

export const test = base.extend<{
  app: WebApp;
  api: ApiClient;
}>({
  app: async ({ page }, use) => {
    await use(new WebApp(page));
  },
  api: async ({}, use) => {
    const tokenPath = path.resolve(__dirname, '..', '.auth', 'token.json');
    if (!fs.existsSync(tokenPath)) {
      throw new Error(`Token file not found at ${tokenPath}. Did the setup test run?`);
    }
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    await use(new ApiClient(API_URL, tokenData.token));
  },
});

test.beforeEach(async ({ api }, testInfo) => {
  await resetDataIfSingleWorkerSingleShard(api, testInfo);
});

async function resetDataIfSingleWorkerSingleShard(
  api: ApiClient,
  testInfo: TestInfo,
): Promise<void> {
  const { workers, shard } = testInfo.config;

  const workersCount = Number(workers);
  const singleWorker = workersCount === 1;
  const singleShard = !shard || shard.total === 1;

  if (singleWorker && singleShard) {
    await api.admin.resetData();
  }
}
export { expect };
