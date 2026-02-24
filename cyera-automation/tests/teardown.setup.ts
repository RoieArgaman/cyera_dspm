import { test as teardown } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createApiClient, resetData } from '../src/api';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:8080';

teardown('reset environment after all tests', async () => {
  const tokenPath = path.resolve(__dirname, '..', '.auth', 'token.json');

  if (!fs.existsSync(tokenPath)) {
    console.warn('[teardown] No token file found, skipping reset.');
    return;
  }

  const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  const api = createApiClient(API_URL, tokenData.token);
  const result = await resetData(api);
  console.log(`[teardown] Environment reset: ${result.message}`);
});
