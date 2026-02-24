import { BaseApiClient } from './BaseApiClient';
import type { Alert, AlertStatus, AlertComment } from '../../types';

export class AlertsClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  async getAll(filters?: { status?: string }): Promise<Alert[]> {
    const params = filters?.status ? { status: filters.status } : undefined;
    const res = await this.http.get<Alert[]>('/api/alerts', { params });
    return res.data;
  }

  async getOpen(): Promise<Alert[]> {
    return this.getAll({ status: 'OPEN' });
  }

  async getById(id: string): Promise<Alert> {
    const res = await this.http.get<Alert>(`/api/alerts/${id}`);
    return res.data;
  }

  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    const res = await this.http.patch<Alert>(`/api/alerts/${id}`, { status });
    return res.data;
  }

  async addComment(id: string, message: string): Promise<AlertComment> {
    const res = await this.http.post<AlertComment>(`/api/alerts/${id}/comments`, { message });
    return res.data;
  }

  async remediate(id: string, note?: string): Promise<Alert> {
    const res = await this.http.post<Alert>(`/api/alerts/${id}/remediate`, { note });
    return res.data;
  }
}
