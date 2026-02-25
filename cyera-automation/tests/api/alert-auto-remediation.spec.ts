/**
 * Alert Auto-Remediation API Test
 *
 * IMPORTANT: This test is EXPECTED TO FAIL by design.
 *
 * The final assertion checks that after a second scan, no identical alert
 * (same policy, same asset) is re-created with status OPEN. In the current
 * system, the scanning engine will re-detect the same violation and create
 * a new OPEN alert even after the previous one was resolved. This is a known
 * limitation / intentional behavior of the mock platform.
 */
import { test, expect } from '../../fixtures';
import { waitForScanComplete, waitForAlertStatus } from '../../src/wait';
import { logger } from '../../src/logger';

test.describe('Alert Auto-Remediation — API', () => {
  test('auto-remediation lifecycle with re-scan verification (expected to FAIL)', async ({ api }) => {
    // Step 1: Start a scan
    logger.info('Step 1: Starting initial scan');
    const scan1 = await api.scans.start();
    expect(scan1.id, 'First scan should return a valid ID').toBeTruthy();
    logger.info(`Scan started with ID: ${scan1.id}`);

    // Step 2: Wait for scan to complete
    logger.info('Step 2: Waiting for initial scan to complete');
    await waitForScanComplete(api, scan1.id, { timeoutMs: 120_000 });

    // Step 3: Find an alert with autoRemediate: true
    logger.info('Step 3: Finding auto-remediate alert');
    const allAlerts = await api.alerts.getAll();
    logger.info(`Total alerts found: ${allAlerts.length}`);

    const autoRemAlert = allAlerts.find(
      (a) =>
        (a.status === 'OPEN' || a.status === 'REMEDIATION_IN_PROGRESS') &&
        a.autoRemediate === true
    );

    expect(autoRemAlert, 'Expected to find an auto-remediate alert').toBeTruthy();
    const alertId = autoRemAlert!.id;
    const alertPolicyId = autoRemAlert!.policyId;
    const alertAssetLocation = autoRemAlert!.assetLocation;
    logger.info(`Found auto-remediate alert: ${alertId} (policy: ${alertPolicyId}, asset: ${alertAssetLocation})`);

    // Step 4: Wait for auto-remediation to complete
    logger.info('Step 4: Waiting for auto-remediation to complete');
    await waitForAlertStatus(api, alertId, ['REMEDIATED_WAITING_FOR_CUSTOMER', 'RESOLVED'], {
      timeoutMs: 120_000,
    });

    // Step 5: Set status to RESOLVED
    logger.info('Step 5: Setting alert status to RESOLVED');
    const currentAlert = await api.alerts.getById(alertId);
    if (currentAlert.status !== 'RESOLVED') {
      await api.alerts.updateStatus(alertId, 'RESOLVED');
    }

    // Step 6: Add comment
    logger.info('Step 6: Adding resolution comment');
    await api.alerts.addComment(alertId, 'Remediation verified successfully and issue is resolved');

    // Step 7: Start another scan
    logger.info('Step 7: Starting second scan');
    const scan2 = await api.scans.start();
    expect(scan2.id, 'Second scan should return a valid ID').toBeTruthy();

    // Step 8: Wait for second scan to complete
    logger.info('Step 8: Waiting for second scan to complete');
    await waitForScanComplete(api, scan2.id, { timeoutMs: 120_000 });

    // Step 9: Check for re-created identical alerts
    logger.info('Step 9: Checking for re-created identical alerts');
    const alertsAfterSecondScan = await api.alerts.getAll();
    const identicalOpenAlerts = alertsAfterSecondScan.filter(
      (a) =>
        a.policyId === alertPolicyId &&
        a.assetLocation === alertAssetLocation &&
        a.status === 'OPEN' &&
        a.id !== alertId
    );

    logger.info(`Found ${identicalOpenAlerts.length} identical OPEN alert(s) after second scan`);

    if (identicalOpenAlerts.length > 0) {
      logger.error(
        `EXPECTED FAILURE: ${identicalOpenAlerts.length} re-created alert(s). ` +
        `IDs: [${identicalOpenAlerts.map((a) => a.id).join(', ')}]. ` +
        `The scanning engine re-detects resolved violations and creates new OPEN alerts.`
      );
    }

    // Step 10: Assert none exist — EXPECTED TO FAIL by design
    expect(
      identicalOpenAlerts,
      'Expected no identical OPEN alerts after second scan (expected to fail by design)'
    ).toHaveLength(0);
  });
});
