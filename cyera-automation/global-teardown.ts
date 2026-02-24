import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ApiClient } from './src/api/ApiClient';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const API_URL = process.env.API_URL || 'http://localhost:8080';

async function globalTeardown(_config: FullConfig): Promise<void> {
  const tokenPath = path.resolve(__dirname, '.auth/token.json');

  if (!fs.existsSync(tokenPath)) {
    console.warn('[global-teardown] No token file found, skipping reset.');
    return;
  }

  try {
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    const token: string = tokenData.token;

    const api = new ApiClient(API_URL, token);
    const result = await api.admin.resetData();
    console.log(`[global-teardown] Environment reset: ${result.message}`);
  } catch (error) {
    console.error('[global-teardown] Failed to reset environment:', error);
  }
}

export default globalTeardown;
