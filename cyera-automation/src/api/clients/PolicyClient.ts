import { BaseApiClient } from './BaseApiClient';
import { step } from 'decorators/stepDecorator';
import type { PolicyConfig } from '../types';

export class PolicyClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  @step('Get policy configuration')
  async getConfig(): Promise<PolicyConfig> {
    const res = await this.get<PolicyConfig>('/api/policy-config');
    return res.data;
  }
}
