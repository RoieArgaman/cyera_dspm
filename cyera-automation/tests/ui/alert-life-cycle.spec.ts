import {
  test,
  expect,
  resolveAlertIdentityFromDrawerOrApi,
  logExpectedFailureIfIdenticalAlertFound,
} from './index';
import { Allure as allure } from '../../src/utils/AllureJsCommon';
import { waitForScanComplete } from '../../src/wait';
import { logger } from 'logger';

test.describe('Alert Life Cycle — UI', () => {
  test('Manual remediation workflow', async ({ app, api, scan }) => {
    await allure.suite('Alert Life Cycle');

    // Step 1: scan fixture already ran (started scan, waited for completion, ensured one OPEN alert with autoRemediate false)
    // Step 2: Navigate to alerts list
    await app.alerts.goto();

    // Step 3: Find first alert with status OPEN and autoRemediate: false
    const index = await app.alerts.clickFirstAlertByStatusAndAutoRemediate('Open', false);
    expect(index, 'Expected to find an OPEN alert with autoRemediate OFF').toBeGreaterThanOrEqual(0);

    // Step 4: Open the alert detail drawer
    await expect(app.alertDetail.drawerRoot, 'Alert detail drawer should be visible after clicking an alert row').toBeVisible({ timeout: 15_000 });

    // Step 5: Change status to IN_PROGRESS
    await app.alertDetail.changeStatus('In Progress');

    // Step 6: Assign to "Security Analyst"
    await app.alertDetail.changeAssignee('Security Analyst');

    // Step 7: Add remediation notes and click the Remediate button
    await app.alertDetail.remediate('Manual remediation initiated for security review');

    // Step 8: Wait for status to update (remediation is async, 10-50s)
    await expect(app.alertDetail.statusLabel, 'Status should eventually become Awaiting User Verification',).toHaveText(/Awaiting User Verification/i, { timeout: 120_000 });

    // Step 9: Change status to RESOLVED
    await app.alertDetail.changeStatus('Resolved');

    // Step 10: Add comment confirming resolution (unique per test run)
    const resolutionComment = `Manual remediation UI test resolution at ${new Date().toISOString()}`;
    await app.alertDetail.addComment(resolutionComment);

    // Step 11: Assert final status is RESOLVED in the UI
    const finalStatus = await app.alertDetail.getCurrentStatus();
    expect(finalStatus.toLowerCase(), 'Final alert status should indicate the alert is resolved').toContain(
      'resolved',
    );

    // Step 12: Verify backend alert status and comments for the alert that received this resolution comment
    const allAlerts = await api.alerts.getAll();
    const backendAlert = allAlerts.find((alert) =>
      (alert.comments || []).some((comment) => comment.message === resolutionComment),
    );

    expect(backendAlert, 'Expected to find backend alert with the resolution comment added in the manual remediation workflow').toBeTruthy();
    expect(
      backendAlert!.status,
      'Backend alert status should be RESOLVED after manual remediation flow',
    ).toBe('RESOLVED');

    expect(
      backendAlert!.comments.length,
      'Backend alert should contain at least one comment after resolution',
    ).toBeGreaterThan(0);
  });

  test('Auto-remediation lifecycle with re-scan verification (expected to FAIL)', async ({app, isAutoRemediate, api}) => {
    await allure.suite('Alert Life Cycle');

    // Step 1: Start scan (API only — no scan UI)
    logger.info('Step 1: Starting initial scan');
    const scan1 = await api.scans.start();
    expect(scan1.id, 'First scan should return a valid ID').toBeTruthy();
    logger.info(`Scan started with ID: ${scan1.id}`);

    // Step 2: Wait for scan to complete
    logger.info('Step 2: Waiting for initial scan to complete');
    await waitForScanComplete(api, scan1.id, { timeoutMs: 120_000 });

    // Step 3: Navigate to alerts and find first OPEN alert with AutoRemediate ON (UI)
    logger.info('Step 3: Finding auto-remediate alert in UI');
    await app.alerts.goto();
    const index = await app.alerts.clickFirstAlertByStatusAndAutoRemediate('Open', true);
    expect(index, 'Expected to find an OPEN alert with autoRemediate ON').toBeGreaterThanOrEqual(0);

    // Step 4: Wait for drawer and capture policy + asset for finding identical alert later
    await expect(
      app.alertDetail.drawerRoot,
      'Alert detail drawer should be visible after clicking an alert row',
    ).toBeVisible({ timeout: 15_000 });

    const drawerPolicyName = await app.alertDetail.getPolicyName();
    const drawerAssetDisplayOrLocation = await app.alertDetail.getAssetDisplayOrLocation();
    const { policyName, assetDisplayOrLocation } = await resolveAlertIdentityFromDrawerOrApi({
      policyName: drawerPolicyName,
      assetDisplayOrLocation: drawerAssetDisplayOrLocation,
      api,
      isAutoRemediate,
    });
    logger.info(`Captured identity: policy=${policyName}, asset=${assetDisplayOrLocation}`);

    // Step 5: Wait for auto-remediation to complete (UI)
    logger.info('Step 5: Waiting for auto-remediation status in drawer');
    await expect(
      app.alertDetail.statusLabel,
      'Status should eventually become Awaiting User Verification or Remediated',
    ).toHaveText(/Awaiting User Verification|Remediated|Resolved/i, { timeout: 120_000 });

    // Step 6: Set status to Resolved and add comment (UI)
    logger.info('Step 6: Setting status to Resolved and adding comment');
    await app.alertDetail.changeStatus('Resolved');
    await app.alertDetail.addComment('Remediation verified successfully and issue is resolved');

    // Step 7: Close drawer before second scan
    await app.alertDetail.closeDrawer();

    // Step 8: Start second scan and wait (API only)
    logger.info('Step 8: Starting second scan');
    const scan2 = await api.scans.start();
    expect(scan2.id, 'Second scan should return a valid ID').toBeTruthy();
    logger.info('Step 9: Waiting for second scan to complete');
    await waitForScanComplete(api, scan2.id, { timeoutMs: 120_000 });

    // Step 10: Find identical OPEN alert in UI (same policy + asset)
    logger.info('Step 10: Checking for re-created identical alert in UI');
    await app.alerts.goto();
    const identicalRowIndex = await app.alerts.findOpenAlertRowByPolicyAndAsset(
      policyName,
      assetDisplayOrLocation,
    );
    logExpectedFailureIfIdenticalAlertFound(identicalRowIndex);

    expect(
      identicalRowIndex,
      'Expected no identical OPEN alert after re-scan (expected to fail by design)',
    ).toBe(-1);

    // Step 11: Also verify in the backend that no OPEN alert exists for the same identity
    const policyKey = (policyName ?? '').trim().toLowerCase();
    const assetKey = (assetDisplayOrLocation ?? '').trim().toLowerCase();

    const openAlerts = await api.alerts.getOpen();

    const matchingOpen = openAlerts.find((alert) => {
      const alertPolicyKey = (alert.policyName || alert.policyId || '').trim().toLowerCase();
      const alertAssetKey = (alert.assetDisplayName || alert.assetLocation || '')
        .trim()
        .toLowerCase();
      return alertPolicyKey === policyKey && alertAssetKey === assetKey;
    });

    expect(
      matchingOpen,
      'Expected no OPEN alert in backend with the same policy + asset identity after re-scan',
    ).toBeUndefined();
  });
});

