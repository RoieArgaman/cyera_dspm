export type AlertStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'REMEDIATION_IN_PROGRESS'
  | 'REMEDIATED_WAITING_FOR_CUSTOMER'
  | 'RESOLVED'
  | 'REOPEN';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ScanStatus = 'RUNNING' | 'COMPLETED';

export type RemediationOrigin = 'AUTO' | 'MANUAL' | 'NONE';

export type ViolationType =
  | 'PUBLIC_ACCESS'
  | 'UNENCRYPTED_DATA'
  | 'OVERLY_PERMISSIVE_ACCESS'
  | 'DATA_RETENTION_EXCEEDED'
  | 'MISSING_CLASSIFICATION'
  | 'SENSITIVE_DATA_EXPOSED';

export interface Asset {
  id: string;
  type: string;
  location: string;
  metadata: Record<string, unknown>;
}

export interface AlertRemediation {
  type: string;
  priority: Severity;
  dueDate?: string;
  autoRemediate: boolean;
  note?: string;
}

export interface PolicySnapshot {
  violationType: string;
  supportedAssets: {
    assetCategory: 'CLOUD' | 'SAAS';
    cloudProviders?: Array<{ provider: string; dataStores: string[] }>;
    saasTools?: string[];
  };
  remediationType: string | null;
  autoRemediate: boolean;
  remediationPriority: string | null;
  remediationDue: { value: number; unit: string } | null;
}

export interface Assignee {
  id: string;
  name: string;
  email?: string;
}

export interface AlertComment {
  id: string;
  author: { id: string; name: string };
  message: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  runId: string;
  policyId: string;
  policyName: string;
  severity: Severity;
  status: AlertStatus;
  wasRemediated: boolean;
  remediationOrigin: RemediationOrigin;
  createdSeverity: Severity;
  violationType: ViolationType;
  assetCategory: 'CLOUD' | 'SAAS';
  cloudProvider: string | null;
  dataStoreType: string | null;
  saasTool: string | null;
  assetDisplayName: string;
  assetLocation: string;
  assetId?: string;
  accountId?: string;
  asset: Asset;
  description: string;
  evidence: Record<string, unknown>;
  remediation?: AlertRemediation;
  policySnapshot?: PolicySnapshot;
  assignedTo?: Assignee | null;
  comments: AlertComment[];
  createdAt: string;
  updatedAt?: string;
  statusUpdatedAt?: string;
  validTransitions?: AlertStatus[];
  canRemediate?: boolean;
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

export interface Policy {
  id: string;
  name: string;
  severity: Severity;
  enabled: boolean;
  description: string;
  definition: Record<string, unknown>;
  isSystemPolicy: boolean;
  createdAt: string;
  updatedAt?: string;
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
  user: {
    id: string;
    displayName: string;
    role: string;
  };
}

export interface ResetResponse {
  success: boolean;
  message: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}
