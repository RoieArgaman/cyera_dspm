import { BaseApiClient } from './BaseApiClient';
import type { Scan, ScanStatusResponse } from '../../types';

export class ScansClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  async start(): Promise<Scan> {
    const res = await this.requestWithStep<Scan>(
      'POST',
      '/api/scans',
      undefined,
      'Start scan',
    );
    return res.data;
  }

  async getById(id: string): Promise<Scan> {
    const res = await this.requestWithStep<Scan>(
      'GET',
      `/api/scans/${id}`,
      undefined,
      'Get scan by ID',
    );
    return res.data;
  }

  async getStatus(): Promise<ScanStatusResponse> {
    const res = await this.requestWithStep<ScanStatusResponse>(
      'GET',
      '/api/scans/status',
      undefined,
      'Get scan status',
    );
    return res.data;
  }
}
