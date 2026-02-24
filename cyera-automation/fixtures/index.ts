import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { WebApp } from '../src/web/WebApp';
import { ApiClient } from '../src/api/ApiClient';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:8080';

/**
 * Custom fixture types for the DSPM automation framework.
 */
interface DspmFixtures {
  /** WebApp page-object aggregator — browser context is pre-authenticated via storageState. */
  app: WebApp;
  /** ApiClient aggregator — reads the bearer token from .auth/token.json. */
  api: ApiClient;
}

export const test = base.extend<DspmFixtures>({
  /**
   * `app` fixture: instantiate WebApp(page).
   * The page is already authenticated via storageState in playwright config — no login needed.
   */
  app: async ({ page }, use) => {
    const app = new WebApp(page);
    await use(app);
  },

  /**
   * `api` fixture: read the bearer token from .auth/token.json and instantiate ApiClient.
   */
  api: async ({}, use) => {
    const tokenPath = path.resolve(__dirname, '..', '.auth', 'token.json');
    if (!fs.existsSync(tokenPath)) {
      throw new Error(
        `Token file not found at ${tokenPath}. Did global-setup run?`
      );
    }
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    const token: string = tokenData.token;

    const api = new ApiClient(API_URL, token);
    await use(api);
  },
});

export { expect };
