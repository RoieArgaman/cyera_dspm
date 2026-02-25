import { BaseApiClient } from './BaseApiClient';

export class AdminClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  async resetData(): Promise<{ success: boolean; message: string }> {
    const res = await this.http.post<{ success: boolean; message: string }>('/api/admin/reset');
    return res.data;
  }

  async health(): Promise<{ status: string; timestamp: string; service: string }> {
    const res = await this.http.get<{ status: string; timestamp: string; service: string }>('/api/health');
    return res.data;
  }
}
