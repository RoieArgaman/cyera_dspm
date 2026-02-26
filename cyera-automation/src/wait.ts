import { ApiClient } from './api/ApiClient';
import { logger } from 'logger';
import type { AlertStatus } from './types';

interface WaitOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

/**
 * Polls GET /api/alerts/:id until the alert status matches one of the expected statuses.
 */
export async function waitForAlertStatus(
  api: ApiClient,
  alertId: string,
  expectedStatus: AlertStatus | AlertStatus[],
  options: WaitOptions = {}
): Promise<void> {
  const timeout = options.timeoutMs ?? 120_000;
  const interval = options.intervalMs ?? 3_000;
  const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  logger.info(`Waiting for alert ${alertId} to reach status [${statuses.join(', ')}]`);

  const start = Date.now();
  while (Date.now() - start < timeout) {
    const alert = await api.alerts.getById(alertId);
    logger.info(`Alert ${alertId} current status: ${alert.status}`);

    if (statuses.includes(alert.status)) {
      logger.info(`Alert ${alertId} reached expected status: ${alert.status}`);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timed out waiting for alert ${alertId} to reach [${statuses.join(', ')}] after ${timeout}ms`);
}

/**
 * Polls GET /api/scans/:id until the scan status is COMPLETED.
 */
export async function waitForScanComplete(
  api: ApiClient,
  scanId: string,
  options: WaitOptions = {}
): Promise<void> {
  const timeout = options.timeoutMs ?? 120_000;
  const interval = options.intervalMs ?? 3_000;

  logger.info(`Waiting for scan ${scanId} to complete`);

  const start = Date.now();
  while (Date.now() - start < timeout) {
    const scan = await api.scans.getById(scanId);
    logger.info(`Scan ${scanId} current status: ${scan.status}`);

    if (scan.status === 'COMPLETED') {
      logger.info(`Scan ${scanId} completed`);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timed out waiting for scan ${scanId} to complete after ${timeout}ms`);
}
