import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AlertsPage extends BasePage {
  private readonly alertsTable: Locator;
  private readonly loadingState: Locator;

  constructor(page: Page) {
    super(page);
    this.alertsTable = page.locator('table[aria-label="Alerts list"]');
    this.loadingState = page.locator('text=Loading alerts...');
  }

  async goto(): Promise<void> {
    await this.navigate('/alerts');
    try {
      await this.waitForHidden(this.loadingState, 15_000);
    } catch {
      // Loading might already be gone
    }
  }

  getAlertRows(): Locator {
    return this.alertsTable.locator('tbody tr');
  }

  async getAlertCount(): Promise<number> {
    return this.getAlertRows().count();
  }

  async clickAlertByIndex(index: number): Promise<void> {
    await this.getAlertRows().nth(index).click();
  }

  /**
   * Find and click the first alert row matching the given status text and auto-remediate value.
   * Returns the row index, or -1 if not found.
   */
  async clickFirstAlertByStatusAndAutoRemediate(
    statusText: string,
    autoRemediate: boolean
  ): Promise<number> {
    const rows = this.getAlertRows();
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const statusCell = row.locator('td').nth(3);
      const autoRemCell = row.locator('td').nth(4);

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

  async waitForAlerts(timeout = 30_000): Promise<void> {
    await this.alertsTable.locator('tbody tr').first().waitFor({ state: 'visible', timeout });
  }
}
