import { test, expect } from '../../fixtures';

test.describe('Alert Manual Remediation — UI', () => {
  test('should manually remediate an alert through the full workflow', async ({ app }) => {
    // Step 1: Navigate to alerts list
    await app.alerts.goto();
    await expect(
      app.alerts.alertsTable,
      'Alerts table should be visible after navigation'
    ).toBeVisible({ timeout: 30_000 });

    // Basic page structure assertions using shared locators
    await expect(
      app.alerts.alertsPageRoot,
      'Alerts page root container should be visible'
    ).toBeVisible();
    await expect(
      app.alerts.loadingState,
      'Alerts loading indicator should be hidden after data loads'
    ).toBeHidden();
    await expect(
      app.alerts.alertsTable,
      'Alerts table should be visible in the page layout'
    ).toBeVisible();

    // Step 2: Find first alert with status OPEN and autoRemediate: false
    const index = await app.alerts.clickFirstAlertByStatusAndAutoRemediate('Open', false);
    expect(index, 'Expected to find an OPEN alert with autoRemediate OFF').toBeGreaterThanOrEqual(0);

    // Step 3: Open the alert detail drawer
    await expect(
      app.alertDetail.drawerRoot,
      'Alert detail drawer should be visible after clicking an alert row'
    ).toBeVisible({ timeout: 15_000 });

    // Step 4: Change status to IN_PROGRESS
    await app.alertDetail.changeStatus('In Progress');

    // Step 5: Assign to "Security Analyst"
    await app.alertDetail.changeAssignee('Security Analyst');

    // Step 6: Add remediation notes and click the Remediate button
    await app.alertDetail.remediate('Manual remediation initiated for security review');

    // Step 7: Wait for status to update (remediation is async, 10-50s)
    await expect(
      app.alertDetail.statusLabel,
      'Status should eventually become Awaiting User Verification'
    ).toHaveText(/Awaiting User Verification/i, { timeout: 120_000 });

    // Step 8: Change status to RESOLVED
    await app.alertDetail.changeStatus('Resolved');

    // Step 9: Add comment confirming resolution
    await app.alertDetail.addComment('Remediation verified successfully and issue is resolved');

    // Step 10: Assert final status is RESOLVED
    const finalStatus = await app.alertDetail.getCurrentStatus();
    expect(
      finalStatus.toLowerCase(),
      'Final alert status should indicate the alert is resolved'
    ).toContain('resolved');
  });
});
