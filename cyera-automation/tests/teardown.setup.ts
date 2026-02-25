import { test as teardown } from '../fixtures';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ApiClient } from '../src/api/ApiClient';
import { logger } from '../src/logger';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:8080';

teardown('reset environment after all tests', async () => {
  const tokenPath = path.resolve(__dirname, '..', '.auth', 'token.json');

  if (!fs.existsSync(tokenPath)) {
    logger.warn('[teardown] No token file found, skipping reset.');
    return;
  }

  const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  const api = new ApiClient(API_URL, tokenData.token);
  const result = await api.admin.resetData();
  logger.info('[teardown] Environment reset', { message: result.message });
});
