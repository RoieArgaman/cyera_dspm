import { test as base, expect } from '../../fixtures';
import { waitForScanComplete } from '../../src/wait';
import { logger } from '../../src/logger';
import type { ApiClient } from '../../src/api/ApiClient';

/** API may omit autoRemediate or use snake_case; treat as manual when not explicitly true. */
function isManualRemediation(alert: { autoRemediate?: boolean } & Record<string, unknown>): boolean {
  const ar = alert.autoRemediate ?? alert.auto_remediate;
  return ar !== true;
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
  const candidate = alerts.find((a) => isManualRemediation(a as Record<string, unknown>));
  if (!candidate) {
    logger.error('Fixture: no alert with autoRemediate false (or unset) found');
    throw new Error(
      'At least one alert suitable for manual remediation is required (autoRemediate false or unset)'
    );
  }
  logger.info('Fixture: found candidate alert', { alertId: candidate.id, status: candidate.status });

  if (candidate.status !== 'OPEN') {
    logger.info('Fixture: setting alert status to OPEN', { alertId: candidate.id });
    await api.alerts.updateStatus(candidate.id, 'OPEN');
    logger.info('Fixture: alert status set to OPEN');
  } else {
    logger.info('Fixture: candidate already OPEN, skipping update');
  }
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
