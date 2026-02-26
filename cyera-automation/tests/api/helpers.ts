import type { ApiClient } from '../../src/api/ApiClient';
import type { Alert, AlertStatus } from '../../src/api/types';

/**
 * Ensures an alert is in RESOLVED state: if it is not, transitions it to RESOLVED
 * and returns the updated alert. Used to avoid branching in spec test bodies.
 */
export async function ensureAlertResolved(api: ApiClient, alertId: string): Promise<Alert> {
  const current = await api.alerts.getById(alertId);
  if (current.status !== 'RESOLVED') {
    await api.alerts.updateStatus(alertId, 'RESOLVED');
  }
  return api.alerts.getById(alertId);
}

type TestWithSkip = { skip: (condition: boolean, description: string) => void };
type ExpectType = (value: unknown, message: string) => { toContain: (status: AlertStatus) => void };

/**
 * Asserts that an alert's validTransitions (if present) only contain statuses from
 * the lifecycle table. If validTransitions is missing, skips the test. Branching
 * is confined here so spec bodies stay free of conditionals.
 */
export function assertValidTransitionsMatchLifecycle(
  fresh: Alert,
  lifecycleTableStatuses: AlertStatus[],
  test: TestWithSkip,
  expect: ExpectType,
): void {
  if (!fresh.validTransitions) {
    test.skip(true, 'Backend does not expose validTransitions on Alert; skipping metadata check');
    return;
  }
  for (const status of fresh.validTransitions) {
    expect(
      lifecycleTableStatuses,
      'validTransitions should only contain statuses from the lifecycle table',
    ).toContain(status);
  }
}
