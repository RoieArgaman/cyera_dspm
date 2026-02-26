import { BaseApiClient } from './BaseApiClient';
import { step } from 'decorators/stepDecorator';
import type {
  Alert,
  AlertStatus,
  AlertComment,
  CreateAlertPayload,
} from '../types';

export interface AlertFilters {
  status?: string;
  severity?: string;
  policyId?: string;
  runId?: string;
}

export class AlertsClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  @step('List alerts with optional filters')
  async getAll(filters?: AlertFilters): Promise<Alert[]> {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.severity) params.severity = filters.severity;
    if (filters?.policyId) params.policyId = filters.policyId;
    if (filters?.runId) params.runId = filters.runId;
    const res = await this.get<Alert[]>('/api/alerts', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return res.data;
  }

  @step('List open alerts')
  async getOpen(): Promise<Alert[]> {
    return this.getAll({ status: 'OPEN' });
  }

  @step('Get alert by ID')
  async getById(id: string): Promise<Alert> {
    const res = await this.get<Alert>(`/api/alerts/${id}`);
    return res.data;
  }

  @step('Create alert')
  async create(data: CreateAlertPayload): Promise<Alert> {
    const res = await this.post<Alert>('/api/alerts', { data });
    return res.data;
  }

  @step('Update alert status')
  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    const res = await this.patch<Alert>(`/api/alerts/${id}`, {
      data: { status },
    });
    return res.data;
  }

  @step('Add comment to alert')
  async addComment(id: string, message: string): Promise<AlertComment> {
    const res = await this.post<AlertComment>(`/api/alerts/${id}/comments`, {
      data: { message },
    });
    return res.data;
  }

  @step('Trigger alert remediation')
  async remediate(id: string, note?: string): Promise<Alert> {
    const res = await this.post<Alert>(`/api/alerts/${id}/remediate`, {
      data: { note },
    });
    return res.data;
  }
}
