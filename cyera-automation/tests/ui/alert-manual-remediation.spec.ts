import { test, expect } from '../../fixtures';
import { AlertsPage } from '../../src/pages/AlertsPage';
import { AlertDetailPage } from '../../src/pages/AlertDetailPage';

test.describe('Alert Manual Remediation — UI', () => {
  test('should manually remediate an alert through the full workflow', async ({ page }) => {
    const alertsPage = new AlertsPage(page);
    const alertDetail = new AlertDetailPage(page);

    // Step 1: Navigate to alerts list
    await alertsPage.goto();
    await alertsPage.waitForAlerts();

    // Step 2: Find first alert with status OPEN and autoRemediate: false
    const index = await alertsPage.clickFirstAlertByStatusAndAutoRemediate('Open', false);
    expect(index, 'Expected to find an OPEN alert with autoRemediate OFF').toBeGreaterThanOrEqual(0);

    // Step 3: Open the alert detail drawer
    await alertDetail.waitForDrawer();

    // Step 4: Change status to IN_PROGRESS
    await alertDetail.changeStatus('In Progress');

    // Step 5: Assign to "Security Analyst"
    await alertDetail.changeAssignee('Security Analyst');

    // Step 6: Add remediation notes and click the Remediate button
    await alertDetail.remediate('Manual remediation initiated for security review');

    // Step 7: Wait for status to update (remediation is async, 10-50s)
    await alertDetail.waitForStatusText('Awaiting User Verification', 120_000);

    // Step 8: Change status to RESOLVED
    await alertDetail.changeStatus('Resolved');

    // Step 9: Add comment confirming resolution
    await alertDetail.addComment('Remediation verified successfully and issue is resolved');

    // Step 10: Assert final status is RESOLVED
    const finalStatus = await alertDetail.getCurrentStatus();
    expect(finalStatus.toLowerCase()).toContain('resolved');
  });
});
