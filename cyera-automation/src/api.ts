import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';
import type { Alert, AlertStatus, AlertComment, Scan, ScanStatusResponse, PolicyConfig } from './types';

/**
 * Creates a configured axios instance with auth header and request/response logging.
 */
export function createApiClient(baseUrl: string, token: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: 30_000,
  });

  client.interceptors.request.use((config) => {
    logger.info(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      data: config.data ?? undefined,
      params: config.params ?? undefined,
    });
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      logger.info(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      return response;
    },
    (error) => {
      const status = error.response?.status ?? 'NETWORK_ERROR';
      logger.error(`API Error: ${status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        responseData: error.response?.data,
      });
      return Promise.reject(error);
    }
  );

  return client;
}

// ── Alert functions ──

export async function getAlerts(api: AxiosInstance, filters?: { status?: string }): Promise<Alert[]> {
  const params = filters?.status ? { status: filters.status } : undefined;
  const res = await api.get<Alert[]>('/api/alerts', { params });
  return res.data;
}

export async function getOpenAlerts(api: AxiosInstance): Promise<Alert[]> {
  return getAlerts(api, { status: 'OPEN' });
}

export async function getAlertById(api: AxiosInstance, id: string): Promise<Alert> {
  const res = await api.get<Alert>(`/api/alerts/${id}`);
  return res.data;
}

export async function updateAlertStatus(api: AxiosInstance, id: string, status: AlertStatus): Promise<Alert> {
  const res = await api.patch<Alert>(`/api/alerts/${id}`, { status });
  return res.data;
}

export async function addAlertComment(api: AxiosInstance, id: string, message: string): Promise<AlertComment> {
  const res = await api.post<AlertComment>(`/api/alerts/${id}/comments`, { message });
  return res.data;
}

export async function remediateAlert(api: AxiosInstance, id: string, note?: string): Promise<Alert> {
  const res = await api.post<Alert>(`/api/alerts/${id}/remediate`, { note });
  return res.data;
}

// ── Scan functions ──

export async function startScan(api: AxiosInstance): Promise<Scan> {
  const res = await api.post<Scan>('/api/scans');
  return res.data;
}

export async function getScanById(api: AxiosInstance, id: string): Promise<Scan> {
  const res = await api.get<Scan>(`/api/scans/${id}`);
  return res.data;
}

export async function getScanStatus(api: AxiosInstance): Promise<ScanStatusResponse> {
  const res = await api.get<ScanStatusResponse>('/api/scans/status');
  return res.data;
}

// ── Policy functions ──

export async function getPolicyConfig(api: AxiosInstance): Promise<PolicyConfig> {
  const res = await api.get<PolicyConfig>('/api/policy-config');
  return res.data;
}

// ── Admin functions ──

export async function resetData(api: AxiosInstance): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>('/api/admin/reset');
  return res.data;
}
