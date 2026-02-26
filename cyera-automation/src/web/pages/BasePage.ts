import { Page, Locator } from '@playwright/test';
import { step } from '../../decorators/stepDecorator';

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  @step('Navigate to application path')
  async navigate(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'networkidle' });
  }

  @step('Wait for locator to become visible')
  async waitForVisible(locator: Locator, timeout = 30_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  @step('Wait for locator to become hidden')
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
