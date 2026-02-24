import { BaseApiClient } from './BaseApiClient';
import type { Scan, ScanStatusResponse } from '../../types';

export class ScansClient extends BaseApiClient {
  /**
   * POST /api/scans — start a new scan.
   */
  async start(): Promise<Scan> {
    const response = await this.http.post<Scan>('/api/scans');
    return response.data;
  }

  /**
   * GET /api/scans — list all scans.
   */
  async getAll(): Promise<Scan[]> {
    const response = await this.http.get<Scan[]>('/api/scans');
    return response.data;
  }

  /**
   * GET /api/scans/:id — get a single scan by ID.
   */
  async getById(id: string): Promise<Scan> {
    const response = await this.http.get<Scan>(`/api/scans/${id}`);
    return response.data;
  }

  /**
   * GET /api/scans/status — get the current scan status (IDLE or RUNNING).
   */
  async getStatus(): Promise<ScanStatusResponse> {
    const response = await this.http.get<ScanStatusResponse>('/api/scans/status');
    return response.data;
  }
}
