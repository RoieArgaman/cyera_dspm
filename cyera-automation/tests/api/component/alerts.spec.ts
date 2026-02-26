import { test, expect } from '../index';
import type { Alert, AlertStatus } from '../../../src/types';

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
    expect(
      alertsAfterScan.length,
      'Scan should produce at least one alert to test GET by ID',
    ).toBeGreaterThan(0);

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
    try {
      await api.alerts.updateStatus(alertId, 'OPEN' as AlertStatus);
      expect(true, 'Expected the API to reject OPEN transition from IN_PROGRESS').toBe(false);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        expect(error.response?.status, 'Invalid transition should return HTTP 400').toBe(400);
      } else {
        throw error;
      }
    }

    // Valid transition: IN_PROGRESS -> RESOLVED
    const resolved = await api.alerts.updateStatus(alertId, 'RESOLVED');
    expect(resolved.status, 'Status should update from IN_PROGRESS to RESOLVED').toBe('RESOLVED');

    // Cleanup: reopen so other tests can use it
    const reopened = await api.alerts.updateStatus(alertId, 'REOPEN');
    expect(reopened.status, 'Status should update from RESOLVED back to REOPEN for cleanup').toBe('REOPEN');
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

function isAxiosError(error: unknown): error is { response?: { status: number; data: unknown } } {
  return typeof error === 'object' && error !== null && 'response' in error;
}
