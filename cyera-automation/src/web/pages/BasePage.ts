import { Page, Locator } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'networkidle' });
  }

  async waitForVisible(locator: Locator, timeout = 30_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(locator: Locator, timeout = 30_000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Get the current page URL.
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
