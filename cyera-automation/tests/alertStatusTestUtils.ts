import type { AlertStatus, Alert } from '../src/api/types';
import type { AlertsClient } from '../src/api/clients/AlertsClient';

/**
 * Canonical mapping between backend alert statuses and the user-facing labels
 * we expect to see in the UI. This is used by both API and UI tests so that
 * any change to the lifecycle naming is caught consistently.
 */
export const alertStatusToLabel: Record<AlertStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  REMEDIATION_IN_PROGRESS: 'Remediation In Progress',
  REMEDIATED_WAITING_FOR_CUSTOMER: 'Awaiting Customer',
  RESOLVED: 'Resolved',
  REOPEN: 'Reopen',
};

export const lifecycleTableStatuses: AlertStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'REMEDIATION_IN_PROGRESS',
  'REMEDIATED_WAITING_FOR_CUSTOMER',
  'RESOLVED',
  'REOPEN',
];

export type AlertIdentity = {
  policyName: string;
  assetDisplayOrLocation: string;
};

function normalizeIdentityValue(value: string | undefined | null): string {
  return (value ?? '').trim().toLowerCase();
}

export async function findAlertByIdentity(
  alertsClient: AlertsClient,
  identity: AlertIdentity,
): Promise<Alert | undefined> {
  const policyKey = normalizeIdentityValue(identity.policyName);
  const assetKey = normalizeIdentityValue(identity.assetDisplayOrLocation);

  const allAlerts = await alertsClient.getAll();

  return allAlerts.find((alert) => {
    const alertPolicyKey = normalizeIdentityValue(alert.policyName || alert.policyId);
    const alertAssetKey = normalizeIdentityValue(alert.assetDisplayName || alert.assetLocation);
    return alertPolicyKey === policyKey && alertAssetKey === assetKey;
  });
}
