import { test as base, expect } from '../../fixtures';
import { waitForScanComplete } from '../../src/wait';
import { logger } from 'logger';
import type { ApiClient } from '../../src/api/ApiClient';
import type { Alert } from '../../src/api/types';

/** Check if an alert is for manual remediation (autoRemediate is not true). */
function isManualRemediation(alert: Alert): boolean {
  return alert.policySnapshot?.autoRemediate !== true;
}

/**
 * Used by the `scan` fixture to prepare an OPEN alert with autoRemediate false
 * for manual remediation UI tests.
 */
async function ensureOpenManualRemediationAlert(api: ApiClient): Promise<void> {
  logger.info('Fixture: starting scan to create alerts');
  const scan = await api.scans.start();
  logger.info('Fixture: scan started', { scanId: scan.id });
  await waitForScanComplete(api, scan.id);
  logger.info('Fixture: scan completed');

  const alerts = await api.alerts.getAll();
  logger.info('Fixture: fetched alerts', { count: alerts.length });

  // Find an OPEN alert with autoRemediate false (manual remediation candidate)
  const candidate = alerts.find(
    (a) => a.status === 'OPEN' && isManualRemediation(a),
  );
  if (!candidate) {
    logger.error('Fixture: no OPEN alert with autoRemediate false found');
    throw new Error(
      'At least one OPEN alert suitable for manual remediation is required (autoRemediate false or unset)'
    );
  }
  logger.info('Fixture: found candidate alert', { alertId: candidate.id, status: candidate.status });
}

export const test = base.extend<{
  scan: void;
}>({
  scan: async ({ api }, use) => {
    await ensureOpenManualRemediationAlert(api);
    await use();
  },
});

export { expect };
