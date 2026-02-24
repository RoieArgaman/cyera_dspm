import { BaseApiClient } from './BaseApiClient';
import type { Alert, AlertStatus, AlertComment } from '../../types';

interface AlertFilters {
  status?: AlertStatus;
  severity?: string;
  policyId?: string;
  runId?: string;
}

interface AlertUpdateData {
  status?: AlertStatus;
  severity?: string;
  assignedToId?: string | null;
}

export class AlertsClient extends BaseApiClient {
  /**
   * GET /api/alerts — list all alerts, optionally filtered.
   */
  async getAll(filters?: AlertFilters): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.policyId) params.append('policyId', filters.policyId);
    if (filters?.runId) params.append('runId', filters.runId);

    const query = params.toString();
    const url = `/api/alerts${query ? `?${query}` : ''}`;
    const response = await this.http.get<Alert[]>(url);
    return response.data;
  }

  /**
   * GET /api/alerts?status=OPEN — convenience method for open alerts.
   */
  async getOpen(): Promise<Alert[]> {
    return this.getAll({ status: 'OPEN' });
  }

  /**
   * GET /api/alerts/:id — get a single alert by ID (includes comments).
   */
  async getById(id: string): Promise<Alert> {
    const response = await this.http.get<Alert>(`/api/alerts/${id}`);
    return response.data;
  }

  /**
   * PATCH /api/alerts/:id — update alert status, severity, or assignee.
   */
  async update(id: string, data: AlertUpdateData): Promise<Alert> {
    const response = await this.http.patch<Alert>(`/api/alerts/${id}`, data);
    return response.data;
  }

  /**
   * PATCH /api/alerts/:id — convenience for updating status only.
   */
  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    return this.update(id, { status });
  }

  /**
   * POST /api/alerts/:id/comments — add a comment to an alert.
   */
  async addComment(id: string, message: string): Promise<AlertComment> {
    const response = await this.http.post<AlertComment>(`/api/alerts/${id}/comments`, { message });
    return response.data;
  }

  /**
   * POST /api/alerts/:id/remediate — start manual remediation.
   */
  async remediate(id: string, note?: string): Promise<Alert> {
    const response = await this.http.post<Alert>(`/api/alerts/${id}/remediate`, { note });
    return response.data;
  }

  /**
   * GET /api/alerts/statuses — get available statuses and valid transitions.
   */
  async getStatuses(): Promise<{
    allStatuses: string[];
    validTransitions: Record<string, string[]>;
    remediatableStatuses: string[];
  }> {
    const response = await this.http.get('/api/alerts/statuses');
    return response.data;
  }
}
