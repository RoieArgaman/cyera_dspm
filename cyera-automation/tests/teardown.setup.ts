import { test as teardown } from '../fixtures';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ApiClient } from '../src/api/ApiClient';
import { logger } from 'logger';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:8080';

teardown('reset environment after all tests', async () => {
  const operation = 'teardown.resetEnvironment';
  const tokenPath = path.resolve(__dirname, '..', '.auth', 'token.json');
  const tokenExists = fs.existsSync(tokenPath);

  logger.info('[teardown] Starting environment reset', {
    operation,
    apiUrl: API_URL,
    tokenPath,
    tokenFilePresent: tokenExists,
  });

  if (!tokenExists) {
    logger.warn('[teardown] No token file found, skipping environment reset.', {
      operation,
      reason: 'missing_token_file',
      tokenPath,
    });
    return;
  }

  const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  const api = new ApiClient(API_URL, tokenData.token);
  try {
    const result = await api.admin.resetData();

    logger.info('[teardown] Environment reset completed', {
      operation,
      success: result.success,
      message: result.message,
    });

    if (!result.success) {
      logger.warn('[teardown] Environment reset reported unsuccessful result', {
        operation,
        success: result.success,
        message: result.message,
      });
    }
  } catch (error) {
    logger.error('[teardown] Environment reset failed', {
      operation,
      error,
    });
    throw error;
  }
});
