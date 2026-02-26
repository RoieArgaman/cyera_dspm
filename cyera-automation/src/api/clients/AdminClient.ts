import { BaseApiClient } from './BaseApiClient';

export class AdminClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  async resetData(): Promise<{ success: boolean; message: string }> {
    const res = await this.requestWithStep<{ success: boolean; message: string }>(
      'POST',
      '/api/admin/reset',
      undefined,
      'Reset test environment data',
    );
    return res.data;
  }

  async health(): Promise<{ status: string; timestamp: string; service: string }> {
    const res = await this.requestWithStep<{ status: string; timestamp: string; service: string }>(
      'GET',
      '/api/health',
      undefined,
      'Check API health',
    );
    return res.data;
  }
}
