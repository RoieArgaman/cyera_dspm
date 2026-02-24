import { BaseApiClient } from './BaseApiClient';
import type { ResetResponse, HealthResponse } from '../../types';

export class AdminClient extends BaseApiClient {
  /**
   * POST /api/admin/reset — reset the environment to defaults.
   */
  async resetData(): Promise<ResetResponse> {
    const response = await this.http.post<ResetResponse>('/api/admin/reset');
    return response.data;
  }

  /**
   * GET /api/health — check API health.
   */
  async health(): Promise<HealthResponse> {
    const response = await this.http.get<HealthResponse>('/api/health');
    return response.data;
  }
}
