import { test as setup } from '@playwright/test';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:8080';
const USERNAME = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || '';

const authDir = path.resolve(__dirname, '..', '.auth');

setup('authenticate via browser and save session', async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  // Login via UI
  await page.goto('/');
  await page.locator('#username').fill(USERNAME);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/policies', { timeout: 15_000 });

  // Save browser storage state
  const sessionPath = path.join(authDir, 'session.json');
  await page.context().storageState({ path: sessionPath });

  // Also get an API token
  const loginResponse = await axios.post(`${API_URL}/api/login`, {
    username: USERNAME,
    password: PASSWORD,
  });
  const tokenPath = path.join(authDir, 'token.json');
  fs.writeFileSync(tokenPath, JSON.stringify({ token: loginResponse.data.token }, null, 2));
});
