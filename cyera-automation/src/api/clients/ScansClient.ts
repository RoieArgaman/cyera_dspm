import { BaseApiClient } from './BaseApiClient';
import { step } from 'decorators/stepDecorator';
import type { Scan, ScanStatusResponse } from '../types';

export class ScansClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  @step('Start scan')
  async start(): Promise<Scan> {
    const res = await this.post<Scan>('/api/scans');
    return res.data;
  }

  @step('Get scan by ID')
  async getById(id: string): Promise<Scan> {
    const res = await this.get<Scan>(`/api/scans/${id}`);
    return res.data;
  }

  @step('Get scan status')
  async getStatus(): Promise<ScanStatusResponse> {
    const res = await this.get<ScanStatusResponse>('/api/scans/status');
    return res.data;
  }
}
