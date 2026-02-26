import { BaseApiClient } from './BaseApiClient';
import type { Alert, AlertStatus, AlertComment, CreateAlertPayload } from '../../types';

export class AlertsClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  async getAll(filters?: { status?: string }): Promise<Alert[]> {
    const params = filters?.status ? { status: filters.status } : undefined;
    const res = await this.requestWithStep<Alert[]>(
      'GET',
      '/api/alerts',
      { params },
      'List alerts with optional filters',
    );
    return res.data;
  }

  async getOpen(): Promise<Alert[]> {
    return this.getAll({ status: 'OPEN' });
  }

  async getById(id: string): Promise<Alert> {
    const res = await this.requestWithStep<Alert>(
      'GET',
      `/api/alerts/${id}`,
      undefined,
      'Get alert by ID',
    );
    return res.data;
  }

  async create(data: CreateAlertPayload): Promise<Alert> {
    const res = await this.requestWithStep<Alert>(
      'POST',
      '/api/alerts',
      { data },
      'Create alert',
    );
    return res.data;
  }

  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    const res = await this.requestWithStep<Alert>(
      'PATCH',
      `/api/alerts/${id}`,
      { data: { status } },
      'Update alert status',
    );
    return res.data;
  }

  async addComment(id: string, message: string): Promise<AlertComment> {
    const res = await this.requestWithStep<AlertComment>(
      'POST',
      `/api/alerts/${id}/comments`,
      {
        data: { message },
      },
      'Add comment to alert',
    );
    return res.data;
  }

  async remediate(id: string, note?: string): Promise<Alert> {
    const res = await this.requestWithStep<Alert>(
      'POST',
      `/api/alerts/${id}/remediate`,
      {
        data: { note },
      },
      'Trigger alert remediation',
    );
    return res.data;
  }
}
