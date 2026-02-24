import type { ApiClient } from '../api/ApiClient';
import type { AlertStatus, ScanStatus } from '../types';
import { logger } from './logger';

interface WaitOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes
const DEFAULT_INTERVAL_MS = 3_000;  // 3 seconds

/**
 * Polls api.alerts.getById(alertId) until the alert's status matches the expected status or timeout.
 */
export async function waitForAlertStatus(
  api: ApiClient,
  alertId: string,
  expectedStatus: AlertStatus | AlertStatus[],
  options: WaitOptions = {}
): Promise<void> {
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const interval = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  logger.info(`Waiting for alert ${alertId} to reach status [${statuses.join(', ')}] (timeout: ${timeout}ms)`);

  const start = Date.now();
  while (Date.now() - start < timeout) {
    const alert = await api.alerts.getById(alertId);
    logger.info(`Alert ${alertId} current status: ${alert.status}`);

    if (statuses.includes(alert.status)) {
      logger.info(`Alert ${alertId} reached expected status: ${alert.status}`);
      return;
    }

    await sleep(interval);
  }

  throw new Error(
    `Timed out waiting for alert ${alertId} to reach status [${statuses.join(', ')}] after ${timeout}ms`
  );
}

/**
 * Polls api.scans.getById(scanId) until the scan status is COMPLETED or timeout.
 */
export async function waitForScanComplete(
  api: ApiClient,
  scanId: string,
  options: WaitOptions = {}
): Promise<void> {
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const interval = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const expectedStatus: ScanStatus = 'COMPLETED';

  logger.info(`Waiting for scan ${scanId} to complete (timeout: ${timeout}ms)`);

  const start = Date.now();
  while (Date.now() - start < timeout) {
    const scan = await api.scans.getById(scanId);
    logger.info(`Scan ${scanId} current status: ${scan.status}`);

    if (scan.status === expectedStatus) {
      logger.info(`Scan ${scanId} completed successfully`);
      return;
    }

    await sleep(interval);
  }

  throw new Error(
    `Timed out waiting for scan ${scanId} to complete after ${timeout}ms`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
