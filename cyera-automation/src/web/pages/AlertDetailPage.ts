import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AlertDetailPage extends BasePage {
  private readonly drawer: Locator;
  private readonly statusSelect: Locator;
  private readonly assigneeSelect: Locator;
  private readonly remediateButton: Locator;
  private readonly remediationNoteInput: Locator;
  private readonly commentTextarea: Locator;
  private readonly postCommentButton: Locator;

  constructor(page: Page) {
    super(page);
    this.drawer = page.locator('[data-testid="alert-details-drawer"]');
    this.statusSelect = page.locator('#alert-status');
    this.assigneeSelect = page.locator('#alert-assignee');
    this.remediateButton = page.getByRole('button', { name: 'Remediate' });
    this.remediationNoteInput = page.locator('textarea[aria-label="Remediation note"]');
    this.commentTextarea = page.locator('textarea[aria-label="Comment message"]');
    this.postCommentButton = page.getByRole('button', { name: 'Post Comment' });
  }

  async waitForDrawer(timeout = 15_000): Promise<void> {
    await this.waitForVisible(this.drawer, timeout);
  }

  async changeStatus(newStatus: string): Promise<void> {
    await this.statusSelect.click();
    await this.page.locator('[role="option"]').filter({ hasText: newStatus }).click();
    await this.page.waitForTimeout(1000);
  }

  async changeAssignee(assigneeName: string): Promise<void> {
    await this.assigneeSelect.click();
    await this.page.locator('[role="option"]').filter({ hasText: assigneeName }).click();
    await this.page.waitForTimeout(1000);
  }

  async expandSection(sectionTitle: string): Promise<void> {
    const sectionButton = this.drawer.locator('button').filter({ hasText: sectionTitle });
    const isExpanded = await sectionButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await sectionButton.click();
    }
  }

  async remediate(note?: string): Promise<void> {
    await this.expandSection('Remediation');
    if (note) {
      await this.remediationNoteInput.fill(note);
    }
    await this.remediateButton.click();
    await this.page.waitForTimeout(2000);
  }

  async addComment(message: string): Promise<void> {
    await this.expandSection('Comments');
    await this.commentTextarea.fill(message);
    await this.postCommentButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getCurrentStatus(): Promise<string> {
    return (await this.statusSelect.textContent())?.trim() ?? '';
  }

  /**
   * Polls the status display until it contains the expected text.
   */
  async waitForStatusText(expectedText: string, timeout = 120_000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const current = await this.getCurrentStatus();
      if (current.toLowerCase().includes(expectedText.toLowerCase())) {
        return;
      }
      await this.page.waitForTimeout(2000);
    }
    throw new Error(`Timed out waiting for status text "${expectedText}" after ${timeout}ms`);
  }

  async closeDrawer(): Promise<void> {
    const closeButton = this.drawer.locator('[aria-label="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}
