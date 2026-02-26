import { BaseApiClient } from './BaseApiClient';
import { step } from 'decorators/stepDecorator';
import type { AdminResetResponse, ApiHealthStatus } from '../types/admin';

export class AdminClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  @step('Reset test environment data')
  async resetData(): Promise<AdminResetResponse> {
    const res = await this.post<AdminResetResponse>('/api/admin/reset');
    return res.data;
  }

  @step('Check API health')
  async health(): Promise<ApiHealthStatus> {
    const res = await this.get<ApiHealthStatus>('/api/health');
    return res.data;
  }
}
