export interface AdminResetResponse {
  success: boolean;
  message: string;
}

export interface ApiHealthStatus {
  status: string;
  timestamp: string;
  service: string;
}

