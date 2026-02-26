import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { step } from 'decorators/stepDecorator';

export class AlertDetailPage extends BasePage {
  private readonly drawer: Locator;
  private readonly statusSelect: Locator;
  private readonly assigneeSelect: Locator;
  private readonly remediateButton: Locator;
  private readonly remediationNoteInput: Locator;
  private readonly commentTextarea: Locator;
  private readonly postCommentButton: Locator;
  private readonly policyNameLabel: Locator;
  private readonly assetLocationLabel: Locator;
  private readonly assetDisplayLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.drawer = page.locator('[data-testid="alert-details-drawer"]');
    this.statusSelect = page.locator('#alert-status');
    this.assigneeSelect = page.locator('#alert-assignee');
    // Scope Remediate button to the alert details drawer to avoid strict-mode conflicts
    this.remediateButton = this.drawer.getByRole('button', { name: 'Remediate' });
    this.remediationNoteInput = page.locator('textarea[aria-label="Remediation note"]');
    this.commentTextarea = page.locator('textarea[aria-label="Comment message"]');
    this.postCommentButton = page.getByRole('button', { name: 'Post Comment' });
    this.policyNameLabel = this.drawer.getByTestId('alert-policy-name');
    this.assetLocationLabel = this.drawer.getByTestId('alert-asset-location');
    this.assetDisplayLabel = this.drawer.getByTestId('alert-asset-display');
  }

  get drawerRoot(): Locator {
    return this.drawer;
  }

  get statusLabel(): Locator {
    return this.statusSelect;
  }

  @step('Wait for alert details drawer')
  async waitForDrawer(timeout = 15_000): Promise<void> {
    await this.waitForVisible(this.drawer, timeout);
  }

  @step('Change alert status')
  async changeStatus(newStatus: string): Promise<void> {
    await this.statusSelect.click();
    await this.page.locator('[role="option"]').filter({ hasText: newStatus }).click();
    await this.page.waitForTimeout(1000);
  }

  @step('Change alert assignee')
  async changeAssignee(assigneeName: string): Promise<void> {
    await this.assigneeSelect.click();
    await this.page.locator('[role="option"]').filter({ hasText: assigneeName }).click();
    await this.page.waitForTimeout(1000);
  }

  @step('Expand section in alert details drawer')
  async expandSection(sectionTitle: string): Promise<void> {
    const sectionButton = this.drawer.locator('button').filter({ hasText: sectionTitle });
    const isExpanded = await sectionButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await sectionButton.click();
    }
  }

  @step('Remediate alert')
  async remediate(note?: string): Promise<void> {
    await this.expandSection('Remediation');
    if (note) {
      await this.remediationNoteInput.fill(note);
    }
    await this.remediateButton.click();
    await this.page.waitForTimeout(2000);
  }

  @step('Add comment to alert')
  async addComment(message: string): Promise<void> {
    await this.expandSection('Comments');
    await this.commentTextarea.fill(message);
    await this.postCommentButton.click();
    await this.page.waitForTimeout(1000);
  }

  @step('Get current alert status from drawer')
  async getCurrentStatus(): Promise<string> {
    return (await this.statusSelect.textContent())?.trim() ?? '';
  }

  /**
   * Read policy name from the drawer. Prefers data-testid="alert-policy-name"; returns '' if not found.
   */
  @step('Get policy name from alert details drawer')
  async getPolicyName(): Promise<string> {
    if ((await this.policyNameLabel.count()) === 0) return '';
    return (await this.policyNameLabel.textContent())?.trim() ?? '';
  }

  /**
   * Read asset display name or location from the drawer. Prefers data-testid="alert-asset-location" then "alert-asset-display"; returns '' if not found.
   */
  @step('Get asset display or location from alert details drawer')
  async getAssetDisplayOrLocation(): Promise<string> {
    if ((await this.assetLocationLabel.count()) > 0) {
      return (await this.assetLocationLabel.textContent())?.trim() ?? '';
    }
    if ((await this.assetDisplayLabel.count()) > 0) {
      return (await this.assetDisplayLabel.textContent())?.trim() ?? '';
    }
    return '';
  }

  @step('Get alert identity (policy + asset) from alert details drawer')
  async getIdentity(): Promise<{ policyName: string; assetDisplayOrLocation: string }> {
    const policyName = await this.getPolicyName();
    const assetDisplayOrLocation = await this.getAssetDisplayOrLocation();
    return { policyName, assetDisplayOrLocation };
  }

  @step('Close alert details drawer')
  async closeDrawer(): Promise<void> {
    const closeButton = this.drawer.locator('[aria-label="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}
