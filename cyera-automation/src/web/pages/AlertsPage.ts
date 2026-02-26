import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { step } from '../../decorators/stepDecorator';

export class AlertsPage extends BasePage {
  readonly alertsPageRoot: Locator;
  readonly alertsTable: Locator;
  readonly loadingState: Locator;
  readonly alertRows: Locator;

  constructor(page: Page) {
    super(page);
    this.alertsPageRoot = page.getByTestId('alerts-page');
    // Prefer table labeled "Alerts list" on alerts page; fallback to policies-table for reuse
    this.alertsTable = page.getByRole('table', { name: 'Alerts list' }).or(page.getByTestId('policies-table'));
    this.loadingState = page.getByText('Loading alerts...');
    this.alertRows = this.alertsTable.locator('tbody tr');
  }

  @step('Navigate to Alerts page')
  async goto(): Promise<void> {
    await this.navigate('/alerts');
    try {
      await this.waitForHidden(this.loadingState, 15_000);
    } catch {
      // Loading might already be gone
    }
  }

  getAlertRows(): Locator {
    return this.alertRows;
  }

  async getAlertCount(): Promise<number> {
    return this.alertRows.count();
  }

  @step('Click alert by index')
  async clickAlertByIndex(index: number): Promise<void> {
    await this.alertRows.nth(index).click();
  }

  /**
   * Find and click the first alert row matching the given status text and auto-remediate value.
   * Returns the row index, or -1 if not found.
   */
  @step('Click first alert matching status and auto-remediate')
  async clickFirstAlertByStatusAndAutoRemediate(
    statusText: string,
    autoRemediate: boolean
  ): Promise<number> {
    const rows = this.alertRows;
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const statusCell = row.locator('td').nth(3);
      const autoRemCell = row.locator('td').nth(4);

      const statusValue = (await statusCell.textContent())?.trim() ?? '';
      const autoRemValue = (await autoRemCell.textContent())?.trim() ?? '';

      const matchesStatus = statusValue.toUpperCase().includes(statusText.toUpperCase());
      const autoRemUpper = autoRemValue.toUpperCase();
      const matchesAutoRem = autoRemediate
        ? autoRemUpper === 'ON'
        : (autoRemUpper === 'OFF' || autoRemUpper === '' || autoRemUpper === 'NO' || autoRemUpper === '—');

      if (matchesStatus && matchesAutoRem) {
        await row.click();
        return i;
      }
    }

    return -1;
  }

  async waitForAlerts(timeout = 30_000): Promise<void> {
    await this.waitForVisible(this.alertsTable, timeout);
  }
}
