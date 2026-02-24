import { test as base, expect } from '@playwright/test';
import type { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createApiClient } from '../src/api';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:8080';

export const test = base.extend<{ api: AxiosInstance }>({
  api: async ({}, use) => {
    const tokenPath = path.resolve(__dirname, '..', '.auth', 'token.json');
    if (!fs.existsSync(tokenPath)) {
      throw new Error(`Token file not found at ${tokenPath}. Did the setup test run?`);
    }
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    const api = createApiClient(API_URL, tokenData.token);
    await use(api);
  },
});

export { expect };
