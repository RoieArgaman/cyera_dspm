import { test, expect } from '../../../fixtures';
import { getAlerts, getOpenAlerts, getAlertById, updateAlertStatus, addAlertComment } from '../../../src/api';
import type { Alert, AlertStatus } from '../../../src/types';

test.describe('Alerts API — Component Tests', () => {
  test('GET all alerts returns 200 and array', async ({ api }) => {
    const alerts = await getAlerts(api);
    expect(Array.isArray(alerts)).toBe(true);
  });

  test('Filter alerts by status OPEN returns only open alerts', async ({ api }) => {
    const openAlerts = await getOpenAlerts(api);
    expect(Array.isArray(openAlerts)).toBe(true);

    for (const alert of openAlerts) {
      expect(alert.status).toBe('OPEN');
    }
  });

  test('GET alert by ID returns correct alert', async ({ api }) => {
    const alerts = await getAlerts(api);
    expect(alerts.length).toBeGreaterThan(0);

    const targetId = alerts[0].id;
    const alert = await getAlertById(api, targetId);

    expect(alert).toBeTruthy();
    expect(alert.id).toBe(targetId);
    expect(alert.status).toBeTruthy();
    expect(alert.policyId).toBeTruthy();
    expect(alert.comments).toBeDefined();
  });

  test('PATCH alert status follows valid transitions only', async ({ api }) => {
    const alerts = await getAlerts(api);
    const openAlert = alerts.find((a: Alert) => a.status === 'OPEN');
    expect(openAlert, 'Need an OPEN alert for transition testing').toBeTruthy();

    const alertId = openAlert!.id;

    // Valid transition: OPEN -> IN_PROGRESS
    const updated = await updateAlertStatus(api, alertId, 'IN_PROGRESS');
    expect(updated.status).toBe('IN_PROGRESS');

    // Invalid transition: IN_PROGRESS -> OPEN
    try {
      await updateAlertStatus(api, alertId, 'OPEN' as AlertStatus);
      expect(true, 'Expected the API to reject OPEN transition from IN_PROGRESS').toBe(false);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        expect(error.response?.status).toBe(400);
      } else {
        throw error;
      }
    }

    // Valid transition: IN_PROGRESS -> RESOLVED
    const resolved = await updateAlertStatus(api, alertId, 'RESOLVED');
    expect(resolved.status).toBe('RESOLVED');

    // Cleanup: reopen so other tests can use it
    const reopened = await updateAlertStatus(api, alertId, 'REOPEN');
    expect(reopened.status).toBe('REOPEN');
  });

  test('POST comment to alert succeeds', async ({ api }) => {
    const alerts = await getAlerts(api);
    expect(alerts.length).toBeGreaterThan(0);

    const alertId = alerts[0].id;
    const commentMessage = `Test comment at ${new Date().toISOString()}`;

    const comment = await addAlertComment(api, alertId, commentMessage);

    expect(comment).toBeTruthy();
    expect(comment.id).toBeTruthy();
    expect(comment.message).toBe(commentMessage);
    expect(comment.author).toBeTruthy();
    expect(comment.createdAt).toBeTruthy();
  });
});

function isAxiosError(error: unknown): error is { response?: { status: number; data: unknown } } {
  return typeof error === 'object' && error !== null && 'response' in error;
}
