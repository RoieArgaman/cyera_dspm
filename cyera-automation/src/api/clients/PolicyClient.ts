import { BaseApiClient } from './BaseApiClient';
import type { PolicyConfig } from '../../types';

export class PolicyClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  async getConfig(): Promise<PolicyConfig> {
    const res = await this.http.get<PolicyConfig>('/api/policy-config');
    return res.data;
  }
}
