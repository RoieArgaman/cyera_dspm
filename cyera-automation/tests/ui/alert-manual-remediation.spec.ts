import { test, expect } from './index';

test.describe('Alert Manual Remediation — UI', () => {
  test('should manually remediate an alert through the full workflow', async ({ app, api, scan }) => {
    // Step 1: scan fixture already ran (started scan, waited for completion, ensured one OPEN alert with autoRemediate false)
    // Step 2: Navigate to alerts list
    await app.alerts.goto();

    // Step 3: Find first alert with status OPEN and autoRemediate: false
    const index = await app.alerts.clickFirstAlertByStatusAndAutoRemediate('Open', false);
    expect(index, 'Expected to find an OPEN alert with autoRemediate OFF').toBeGreaterThanOrEqual(0);

    // Step 4: Open the alert detail drawer
    await expect(
      app.alertDetail.drawerRoot,
      'Alert detail drawer should be visible after clicking an alert row'
    ).toBeVisible({ timeout: 15_000 });

    // Step 5: Change status to IN_PROGRESS
    await app.alertDetail.changeStatus('In Progress');

    // Step 6: Assign to "Security Analyst"
    await app.alertDetail.changeAssignee('Security Analyst');

    // Step 7: Add remediation notes and click the Remediate button
    await app.alertDetail.remediate('Manual remediation initiated for security review');

    // Step 8: Wait for status to update (remediation is async, 10-50s)
    await expect(
      app.alertDetail.statusLabel,
      'Status should eventually become Awaiting User Verification'
    ).toHaveText(/Awaiting User Verification/i, { timeout: 120_000 });

    // Step 9: Change status to RESOLVED
    await app.alertDetail.changeStatus('Resolved');

    // Step 10: Add comment confirming resolution
    await app.alertDetail.addComment('Remediation verified successfully and issue is resolved');

    // Step 11: Assert final status is RESOLVED
    const finalStatus = await app.alertDetail.getCurrentStatus();
    expect(
      finalStatus.toLowerCase(),
      'Final alert status should indicate the alert is resolved'
    ).toContain('resolved');
  });
});
