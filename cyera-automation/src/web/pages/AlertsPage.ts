import { BasePage } from './BasePage';
import type { Page, Locator } from '@playwright/test';

export class AlertsPage extends BasePage {
  // Page-level locators
  private readonly pageContainer = this.page.locator('[data-testid="alerts-page"]');
  private readonly alertsTable = this.page.locator('table[aria-label="Alerts list"]');
  private readonly loadingState = this.page.locator('text=Loading alerts...');
  private readonly emptyState = this.page.locator('text=No alerts found. Run a scan to detect security issues.');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the alerts page.
   */
  async goto(): Promise<void> {
    await this.navigate('/alerts');
    // Wait for either the table or the empty state to appear
    await this.page.waitForSelector(
      '[data-testid="alerts-page"]',
      { timeout: 30_000 }
    );
    // Wait for loading to finish
    try {
      await this.loadingState.waitFor({ state: 'hidden', timeout: 15_000 });
    } catch {
      // Loading might already be gone
    }
  }

  /**
   * Check if the alerts page is displayed.
   */
  async isDisplayed(): Promise<boolean> {
    return this.pageContainer.isVisible();
  }

  /**
   * Get all alert rows from the table.
   */
  getAlertRows(): Locator {
    return this.alertsTable.locator('tbody tr');
  }

  /**
   * Get the number of alert rows displayed.
   */
  async getAlertCount(): Promise<number> {
    const rows = this.getAlertRows();
    return rows.count();
  }

  /**
   * Click on an alert row by its index (0-based).
   */
  async clickAlertByIndex(index: number): Promise<void> {
    const rows = this.getAlertRows();
    await rows.nth(index).click();
  }

  /**
   * Find and click the first alert row that has the given status text and auto-remediate value.
   * Returns the index of the clicked row, or -1 if not found.
   */
  async clickFirstAlertByStatusAndAutoRemediate(
    statusText: string,
    autoRemediate: boolean
  ): Promise<number> {
    const rows = this.getAlertRows();
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const statusCell = row.locator('td').nth(3); // Status column (4th)
      const autoRemCell = row.locator('td').nth(4); // Auto Remediate column (5th)

      const statusValue = (await statusCell.textContent())?.trim() ?? '';
      const autoRemValue = (await autoRemCell.textContent())?.trim() ?? '';

      const matchesStatus = statusValue.toUpperCase().includes(statusText.toUpperCase());
      const matchesAutoRem = autoRemediate
        ? autoRemValue.toUpperCase() === 'ON'
        : autoRemValue.toUpperCase() === 'OFF';

      if (matchesStatus && matchesAutoRem) {
        await row.click();
        return i;
      }
    }

    return -1;
  }

  /**
   * Wait for the alerts table to have at least one row.
   */
  async waitForAlerts(timeout = 30_000): Promise<void> {
    await this.alertsTable.locator('tbody tr').first().waitFor({ state: 'visible', timeout });
  }
}
