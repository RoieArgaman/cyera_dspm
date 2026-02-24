import { chromium, FullConfig } from '@playwright/test';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8080';
const USERNAME = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Aa123456';

async function globalSetup(_config: FullConfig): Promise<void> {
  const authDir = path.resolve(__dirname, '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  // ── Step 1: Browser login to save storageState ──
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Fill in login form
    await page.locator('#username').fill(USERNAME);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();

    // Wait for successful redirect (login redirects to /policies)
    await page.waitForURL('**/policies', { timeout: 15_000 });

    // Save browser storage state
    const sessionPath = path.join(authDir, 'session.json');
    await context.storageState({ path: sessionPath });
    console.log(`[global-setup] Browser session saved to ${sessionPath}`);
  } finally {
    await browser.close();
  }

  // ── Step 2: API login to save bearer token ──
  try {
    const loginResponse = await axios.post(`${API_URL}/api/login`, {
      username: USERNAME,
      password: PASSWORD,
    });

    const token = loginResponse.data.token;
    const tokenPath = path.join(authDir, 'token.json');
    fs.writeFileSync(tokenPath, JSON.stringify({ token }, null, 2));
    console.log(`[global-setup] API token saved to ${tokenPath}`);
  } catch (error) {
    console.error('[global-setup] API login failed:', error);
    throw error;
  }
}

export default globalSetup;
