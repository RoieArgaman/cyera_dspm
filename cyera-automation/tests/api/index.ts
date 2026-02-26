import { test as base, expect } from '../../fixtures';
import { waitForScanComplete } from '../../src/wait';
import { logger } from 'logger';
import type { ApiClient } from '../../src/api/ApiClient';
import type { Alert } from '../../src/api/types';

async function createAlertsViaScan(api: ApiClient): Promise<Alert[]> {
  logger.info('API fixture: starting scan to seed alerts');
  const scan = await api.scans.start();
  logger.info('API fixture: scan started', { scanId: scan.id });

  await waitForScanComplete(api, scan.id, { timeoutMs: 120_000 });
  logger.info('API fixture: scan completed', { scanId: scan.id });

  // Filter by runId so each test only sees alerts from its own scan
  const alerts = await api.alerts.getAll({ runId: scan.id });
  logger.info('API fixture: fetched alerts for this scan', { count: alerts.length, runId: scan.id });

  if (!alerts.length) {
    throw new Error('Scan completed but produced no alerts; cannot run alert API component tests.');
  }

  return alerts;
}

export const test = base.extend<{
  alertsAfterScan: Alert[];
}>({
  alertsAfterScan: async ({ api }, use) => {
    const alerts = await createAlertsViaScan(api);
    await use(alerts);
  },
});

export { expect };

