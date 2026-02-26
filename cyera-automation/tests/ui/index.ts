import { test as base, expect } from '../../fixtures';
import { waitForScanComplete } from '../../src/wait';
import { logger } from 'logger';
import type { ApiClient } from '../../src/api/ApiClient';
import type { Alert } from '../../src/api/types';

/** API may omit autoRemediate or use snake_case; treat as manual when not explicitly true. */
function isManualRemediation(
  alert: { autoRemediate?: boolean } & Record<string, unknown>,
): boolean {
  const ar = alert.autoRemediate ?? (alert as Record<string, unknown>).auto_remediate;
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
  const candidate = alerts.find((a) =>
    isManualRemediation(a as unknown as Record<string, unknown>),
  );
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

/**
 * Resolves policy name and asset display/location from drawer values, falling back to API
 * when either is missing. Use from specs to avoid if-statements in test bodies.
 */
export async function resolveAlertIdentityFromDrawerOrApi(params: {
  policyName: string | null | undefined;
  assetDisplayOrLocation: string | null | undefined;
  api: ApiClient;
  isAutoRemediate: (a: Alert | Record<string, unknown>) => boolean;
}): Promise<{ policyName: string; assetDisplayOrLocation: string }> {
  if (params.policyName && params.assetDisplayOrLocation) {
    return {
      policyName: params.policyName,
      assetDisplayOrLocation: params.assetDisplayOrLocation,
    };
  }
  logger.info('Policy/asset not in drawer; reading from API for identity');
  const allAlerts = await params.api.alerts.getAll();
  const autoRemAlert = allAlerts.find(
    (a) =>
      (a.status === 'OPEN' || a.status === 'REMEDIATION_IN_PROGRESS') &&
      params.isAutoRemediate(a),
  );
  expect(autoRemAlert, 'Expected to find an auto-remediate alert for identity').toBeTruthy();
  return {
    policyName:
      params.policyName || autoRemAlert!.policyName || autoRemAlert!.policyId || '',
    assetDisplayOrLocation:
      params.assetDisplayOrLocation ||
      autoRemAlert!.assetDisplayName ||
      autoRemAlert!.assetLocation ||
      '',
  };
}

/**
 * Logs an expected-failure message when an identical OPEN alert was found at the given row index.
 * Use from specs to avoid if-statements in test bodies; the assertion remains in the spec.
 */
export function logExpectedFailureIfIdenticalAlertFound(identicalRowIndex: number): void {
  if (identicalRowIndex >= 0) {
    logger.error(
      `EXPECTED FAILURE: Found identical OPEN alert at row index ${identicalRowIndex}. ` +
        `The scanning engine re-detects resolved violations and creates new OPEN alerts.`,
    );
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
