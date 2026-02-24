import { BaseApiClient } from './BaseApiClient';
import type { Scan, ScanStatusResponse } from '../../types';

export class ScansClient extends BaseApiClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl, token);
  }

  async start(): Promise<Scan> {
    const res = await this.http.post<Scan>('/api/scans');
    return res.data;
  }

  async getById(id: string): Promise<Scan> {
    const res = await this.http.get<Scan>(`/api/scans/${id}`);
    return res.data;
  }

  async getStatus(): Promise<ScanStatusResponse> {
    const res = await this.http.get<ScanStatusResponse>('/api/scans/status');
    return res.data;
  }
}
