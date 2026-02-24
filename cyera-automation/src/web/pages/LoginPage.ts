import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class LoginPage extends BasePage {
  // Locators
  private readonly usernameInput = this.page.locator('#username');
  private readonly passwordInput = this.page.locator('#password');
  private readonly submitButton = this.page.locator('button[type="submit"]');
  private readonly errorAlert = this.page.locator('[role="alert"]');
  private readonly loginPageContainer = this.page.locator('[data-testid="login-page"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the login page.
   */
  async goto(): Promise<void> {
    await this.navigate('/');
  }

  /**
   * Perform a full login with the given credentials.
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    // Wait for navigation away from login page
    await this.page.waitForURL('**/policies', { timeout: 15_000 });
  }

  /**
   * Check if the login page is displayed.
   */
  async isDisplayed(): Promise<boolean> {
    return this.loginPageContainer.isVisible();
  }

  /**
   * Get the error message text if displayed.
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorAlert.isVisible()) {
      return this.errorAlert.textContent();
    }
    return null;
  }
}
