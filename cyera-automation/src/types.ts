export type AlertStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'REMEDIATION_IN_PROGRESS'
  | 'REMEDIATED_WAITING_FOR_CUSTOMER'
  | 'RESOLVED'
  | 'REOPEN';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ScanStatus = 'RUNNING' | 'COMPLETED';

export interface Alert {
  id: string;
  runId: string;
  policyId: string;
  policyName: string;
  severity: Severity;
  status: AlertStatus;
  autoRemediate: boolean;
  assetDisplayName: string;
  assetLocation: string;
  description: string;
  comments: AlertComment[];
  assignedTo?: { id: string; name: string } | null;
  policySnapshot?: { autoRemediate: boolean };
  validTransitions?: AlertStatus[];
  canRemediate?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AlertComment {
  id: string;
  author: { id: string; name: string };
  message: string;
  createdAt: string;
}

export interface Scan {
  id: string;
  status: ScanStatus;
  startedAt: string;
  completedAt?: string;
  scannedAssetsCount: number;
  alertsCreatedCount: number;
}

export interface ScanStatusResponse {
  status: 'IDLE' | 'RUNNING';
  scanId?: string;
  startedAt?: string;
  lastCompleted?: {
    scanId: string;
    completedAt: string;
    alertsCreatedCount: number;
  } | null;
}

export interface PolicyConfig {
  assets: {
    cloudProviders: string[];
    cloudDataStoresByProvider: Record<string, string[]>;
    saasTools: string[];
  };
  enums: {
    violationTypes: string[];
    severities: string[];
    dataClassificationCategories: string[];
    remediationTypes: string[];
    remediationPriorities: string[];
    remediationDueUnits: string[];
    alertStatuses: string[];
  };
  labels: Record<string, unknown>;
}

export interface LoginResponse {
  token: string;
  user: { id: string; displayName: string; role: string };
}
