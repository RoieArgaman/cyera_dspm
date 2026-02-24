import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class AlertDetailPage extends BasePage {
  // Drawer locators
  private readonly drawer = this.page.locator('[data-testid="alert-details-drawer"]');
  private readonly statusSelect = this.page.locator('#alert-status');
  private readonly severitySelect = this.page.locator('#alert-severity');
  private readonly assigneeSelect = this.page.locator('#alert-assignee');
  private readonly remediateButton = this.page.getByRole('button', { name: 'Remediate' });
  private readonly remediationNoteInput = this.page.locator('textarea[aria-label="Remediation note"]');
  private readonly commentTextarea = this.page.locator('textarea[aria-label="Comment message"]');
  private readonly postCommentButton = this.page.getByRole('button', { name: 'Post Comment' });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for the alert detail drawer to be visible.
   */
  async waitForDrawer(timeout = 15_000): Promise<void> {
    await this.drawer.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if the drawer is open.
   */
  async isDrawerOpen(): Promise<boolean> {
    return this.drawer.isVisible();
  }

  /**
   * Change the alert status via the status dropdown.
   */
  async changeStatus(newStatus: string): Promise<void> {
    // The status dropdown is a custom SingleSelect component
    // We need to click it to open, then select the option
    await this.statusSelect.click();
    // Wait for dropdown options to appear and click the matching one
    const option = this.page.locator(`[role="option"]`).filter({ hasText: newStatus });
    await option.click();
    // Wait for the update to process
    await this.page.waitForTimeout(1000);
  }

  /**
   * Change the alert severity via the severity dropdown.
   */
  async changeSeverity(newSeverity: string): Promise<void> {
    await this.severitySelect.click();
    const option = this.page.locator(`[role="option"]`).filter({ hasText: newSeverity });
    await option.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Change the assignee via the assignee dropdown.
   */
  async changeAssignee(assigneeName: string): Promise<void> {
    await this.assigneeSelect.click();
    const option = this.page.locator(`[role="option"]`).filter({ hasText: assigneeName });
    await option.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Expand a collapsible section by title.
   */
  async expandSection(sectionTitle: string): Promise<void> {
    const sectionButton = this.drawer.locator('button').filter({ hasText: sectionTitle });
    const isExpanded = await sectionButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await sectionButton.click();
    }
  }

  /**
   * Add a remediation note and click the Remediate button.
   */
  async remediate(note?: string): Promise<void> {
    // Expand the remediation section first
    await this.expandSection('Remediation');

    if (note) {
      await this.remediationNoteInput.fill(note);
    }
    await this.remediateButton.click();
    // Wait for the remediation action to process
    await this.page.waitForTimeout(2000);
  }

  /**
   * Add a comment to the alert.
   */
  async addComment(message: string): Promise<void> {
    // Expand the comments section first
    await this.expandSection('Comments');
    await this.commentTextarea.fill(message);
    await this.postCommentButton.click();
    // Wait for the comment to be posted
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the current status text displayed in the drawer.
   */
  async getCurrentStatus(): Promise<string> {
    // The status is shown in the Management section
    const statusContainer = this.drawer.locator('#alert-status');
    return (await statusContainer.textContent())?.trim() ?? '';
  }

  /**
   * Get the current assignee text displayed in the drawer.
   */
  async getCurrentAssignee(): Promise<string> {
    const assigneeContainer = this.drawer.locator('#alert-assignee');
    return (await assigneeContainer.textContent())?.trim() ?? '';
  }

  /**
   * Wait for the alert status badge to show a specific text in the drawer.
   * This polls the status display in the Policy section.
   */
  async waitForStatusText(
    expectedText: string,
    timeout = 120_000
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      // Check the management section status display
      const currentStatus = await this.getCurrentStatus();
      if (currentStatus.toLowerCase().includes(expectedText.toLowerCase())) {
        return;
      }
      await this.page.waitForTimeout(2000);
    }
    throw new Error(
      `Timed out waiting for status text "${expectedText}" after ${timeout}ms`
    );
  }

  /**
   * Close the detail drawer.
   */
  async closeDrawer(): Promise<void> {
    const closeButton = this.drawer.locator('button').filter({ hasText: 'Close' }).first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Try clicking the X button or overlay
      const xButton = this.drawer.locator('[aria-label="Close"]').first();
      if (await xButton.isVisible()) {
        await xButton.click();
      }
    }
  }
}
