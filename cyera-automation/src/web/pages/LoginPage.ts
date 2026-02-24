import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { step } from '../../test/stepDecorator';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  @step('Navigate to login page')
  async goto(): Promise<void> {
    await this.navigate('/');
  }

  @step('Log in')
  async login(username: string, password: string): Promise<void> {
    await this.page.locator('#username').fill(username);
    await this.page.locator('#password').fill(password);
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL('**/policies', { timeout: 15_000 });
  }

  async isDisplayed(): Promise<boolean> {
    return this.page.locator('[data-testid="login-page"]').isVisible();
  }

  async getErrorMessage(): Promise<string | null> {
    const alert = this.page.locator('[role="alert"]');
    if (await alert.isVisible()) {
      return alert.textContent();
    }
    return null;
  }
}
