export type AlertStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'REMEDIATION_IN_PROGRESS'
  | 'REMEDIATED_WAITING_FOR_CUSTOMER'
  | 'RESOLVED'
  | 'REOPEN';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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

export type CreateAlertPayload = {
  status: AlertStatus;
  autoRemediate: boolean;
} & Record<string, unknown>;

export type CreateAlertOverrides = Partial<CreateAlertPayload>;

export interface AlertComment {
  id: string;
  author: { id: string; name: string };
  message: string;
  createdAt: string;
}

