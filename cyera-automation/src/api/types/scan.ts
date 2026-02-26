export type ScanStatus = 'RUNNING' | 'COMPLETED';

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

