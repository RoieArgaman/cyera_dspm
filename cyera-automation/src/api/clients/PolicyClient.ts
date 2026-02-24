import { BaseApiClient } from './BaseApiClient';
import type { Policy, PolicyConfig } from '../../types';

export class PolicyClient extends BaseApiClient {
  /**
   * GET /api/policies — list all policies.
   */
  async getAll(): Promise<Policy[]> {
    const response = await this.http.get<Policy[]>('/api/policies');
    return response.data;
  }

  /**
   * GET /api/policies/:id — get a single policy by ID.
   */
  async getById(id: string): Promise<Policy> {
    const response = await this.http.get<Policy>(`/api/policies/${id}`);
    return response.data;
  }

  /**
   * GET /api/policy-config — get policy configuration options.
   */
  async getConfig(): Promise<PolicyConfig> {
    const response = await this.http.get<PolicyConfig>('/api/policy-config');
    return response.data;
  }
}
