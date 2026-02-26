import { test, expect } from '../index';
import type { Alert, AlertStatus } from '../../../src/api/types';
import { waitForAlertStatus } from '../../../src/wait';
import { lifecycleTableStatuses } from '../../alertStatusTestUtils';
import { ensureAlertResolved, assertValidTransitionsMatchLifecycle } from '../helpers';

test.describe('Alerts API — Component Tests', () => {
  test('GET all alerts returns 200 and array', async ({ api }) => {
    const alerts = await api.alerts.getAll();
    expect(Array.isArray(alerts), 'GET all alerts should return an array').toBe(true);
  });

  test('Filter alerts by status OPEN returns only open alerts', async ({ api }) => {
    const openAlerts = await api.alerts.getOpen();
    expect(Array.isArray(openAlerts), 'Filtering by OPEN status should return an array of alerts').toBe(true);

    for (const alert of openAlerts) {
      expect(alert.status, 'Filtered alerts should all have status OPEN').toBe('OPEN');
    }
  });

  test('GET alert by ID returns correct alert', async ({ api, alertsAfterScan }) => {
    expect(alertsAfterScan.length, 'Scan should produce at least one alert to test GET by ID').toBeGreaterThan(0);

    const targetId = alertsAfterScan[0].id;
    const alert = await api.alerts.getById(targetId);

    expect(alert, 'GET alert by ID should return an alert').toBeTruthy();
    expect(alert.id, 'Returned alert ID should match requested ID').toBe(targetId);
    expect(alert.status, 'Returned alert should have a status').toBeTruthy();
    expect(alert.policyId, 'Returned alert should have a policyId').toBeTruthy();
    expect(alert.comments, 'Returned alert should have a comments field').toBeDefined();
  });

  test('PATCH alert status follows valid transitions only', async ({ api, alertsAfterScan }) => {
    expect(
      alertsAfterScan.length,
      'Scan should produce at least one alert for transition testing',
    ).toBeGreaterThan(0);

    const openAlert = alertsAfterScan.find((a: Alert) => a.status === 'OPEN');
    expect(openAlert, 'Need an OPEN alert for transition testing').toBeTruthy();

    const alertId = openAlert!.id;

    // Valid transition: OPEN -> IN_PROGRESS
    const updated = await api.alerts.updateStatus(alertId, 'IN_PROGRESS');
    expect(updated.status, 'Status should update from OPEN to IN_PROGRESS').toBe('IN_PROGRESS');

    // Invalid transition: IN_PROGRESS -> OPEN
    await expect(
      api.alerts.updateStatus(alertId, 'OPEN' as AlertStatus),
      'Invalid transition should return HTTP 400',
    ).rejects.toMatchObject({ response: { status: 400 } });

    // Valid transition: IN_PROGRESS -> RESOLVED
    const resolved = await api.alerts.updateStatus(alertId, 'RESOLVED');
    expect(resolved.status, 'Status should update from IN_PROGRESS to RESOLVED').toBe('RESOLVED');

    // Cleanup: reopen so other tests can use it
    const reopened = await api.alerts.updateStatus(alertId, 'REOPEN');
    expect(reopened.status, 'Status should update from RESOLVED back to REOPEN for cleanup').toBe('REOPEN');
  });

  test('PATCH alert status supports full lifecycle transitions from table', async ({
    api,
    alertsAfterScan,
  }) => {
    expect(
      alertsAfterScan.length,
      'Scan should produce at least one alert for full lifecycle testing',
    ).toBeGreaterThan(0);

    const openAlert = alertsAfterScan.find((a: Alert) => a.status === 'OPEN');
    expect(openAlert, 'Need an OPEN alert for full lifecycle testing').toBeTruthy();

    const alertId = openAlert!.id;

    // OPEN -> IN_PROGRESS
    const inProgress = await api.alerts.updateStatus(alertId, 'IN_PROGRESS');
    expect(inProgress.status, 'Status should update from OPEN to IN_PROGRESS for lifecycle test').toBe('IN_PROGRESS');

    // IN_PROGRESS -> REMEDIATION_IN_PROGRESS (via remediation endpoint)
    const remediationStarted = await api.alerts.remediate(alertId, 'API lifecycle test remediation');
    expect(
      ['REMEDIATION_IN_PROGRESS', 'REMEDIATED_WAITING_FOR_CUSTOMER', 'RESOLVED'],
      'Starting remediation from IN_PROGRESS should move alert to REMEDIATION_IN_PROGRESS or later lifecycle status',
    ).toContain(remediationStarted.status);

    // Wait until the system-driven remediation flow completes to REMEDIATED_WAITING_FOR_CUSTOMER or RESOLVED
    await waitForAlertStatus(api, alertId, [
      'REMEDIATED_WAITING_FOR_CUSTOMER',
      'RESOLVED',
    ]);
    const afterRemediation = await api.alerts.getById(alertId);

    expect(
      ['REMEDIATED_WAITING_FOR_CUSTOMER', 'RESOLVED'],
      'Status after remediation should be REMEDIATED_WAITING_FOR_CUSTOMER or RESOLVED',
    ).toContain(afterRemediation.status);

    const resolvedAlert = await ensureAlertResolved(api, alertId);
    expect(
      resolvedAlert.status,
      'Status should be RESOLVED (either already or after transition from REMEDIATED_WAITING_FOR_CUSTOMER)',
    ).toBe('RESOLVED');

    // RESOLVED -> REOPEN
    const reopened = await api.alerts.updateStatus(alertId, 'REOPEN');
    expect(
      reopened.status,
      'Status should update from RESOLVED to REOPEN at the end of the lifecycle',
    ).toBe('REOPEN');

    // REOPEN -> IN_PROGRESS
    const inProgressAgain = await api.alerts.updateStatus(alertId, 'IN_PROGRESS');
    expect(
      inProgressAgain.status,
      'Status should update from REOPEN back to IN_PROGRESS',
    ).toBe('IN_PROGRESS');
  });

  test('PATCH alert status rejects invalid transitions from lifecycle table', async ({
    api,
    alertsAfterScan,
  }) => {
    expect(
      alertsAfterScan.length,
      'Scan should produce at least one alert for invalid transition testing',
    ).toBeGreaterThan(0);

    const openAlert = alertsAfterScan.find((a: Alert) => a.status === 'OPEN');
    expect(openAlert, 'Need an OPEN alert for invalid transition testing').toBeTruthy();

    const alertId = openAlert!.id;

    // Move to IN_PROGRESS to exercise invalid transitions from there.
    const inProgress = await api.alerts.updateStatus(alertId, 'IN_PROGRESS');
    expect(
      inProgress.status,
      'Status should update from OPEN to IN_PROGRESS before invalid transition checks',
    ).toBe('IN_PROGRESS');

    const invalidTargets: AlertStatus[] = ['OPEN', 'REMEDIATION_IN_PROGRESS'];

    for (const target of invalidTargets) {
      await expect(
        api.alerts.updateStatus(alertId, target),
        `Invalid transition IN_PROGRESS -> ${target} should return HTTP 400`,
      ).rejects.toMatchObject({ response: { status: 400 } });
    }
  });

  test('Alert validTransitions metadata matches lifecycle table for a sample alert', async ({
    api,
    alertsAfterScan,
  }) => {
    expect(
      alertsAfterScan.length,
      'Scan should produce at least one alert for validTransitions metadata testing',
    ).toBeGreaterThan(0);

    const alert = alertsAfterScan[0];
    const fresh = await api.alerts.getById(alert.id);

    assertValidTransitionsMatchLifecycle(fresh, lifecycleTableStatuses, test, expect);
  });

  test('POST comment to alert succeeds', async ({ api, alertsAfterScan }) => {
    expect(
      alertsAfterScan.length,
      'Scan should produce at least one alert to add a comment to',
    ).toBeGreaterThan(0);

    const alertId = alertsAfterScan[0].id;
    const commentMessage = `Test comment at ${new Date().toISOString()}`;

    const comment = await api.alerts.addComment(alertId, commentMessage);

    expect(comment, 'POST comment should return a comment object').toBeTruthy();
    expect(comment.id, 'Comment should have an ID').toBeTruthy();
    expect(comment.message, 'Comment message should match the one sent').toBe(commentMessage);
    expect(comment.author, 'Comment should have an author').toBeTruthy();
    expect(comment.createdAt, 'Comment should have a createdAt timestamp').toBeTruthy();
  });
});
