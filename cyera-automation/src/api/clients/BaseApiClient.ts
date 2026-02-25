import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { logger } from '../../logger';

export class BaseApiClient {
  protected readonly http: AxiosInstance;

  constructor(baseURL: string, token: string) {
    this.http = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: 30_000,
    });

    // Request interceptor — log every outgoing request
    this.http.interceptors.request.use((config) => {
      logger.info(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        data: config.data ?? undefined,
        params: config.params ?? undefined,
      });
      return config;
    });

    // Response interceptor — log every response
    this.http.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.info(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        const status = error.response?.status ?? 'NETWORK_ERROR';
        const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN';
        const url = error.config?.url ?? 'UNKNOWN';
        const responseData = error.response?.data;

        logger.error(`API Error: ${status} ${method} ${url}`, {
          status,
          method,
          url,
          responseData,
        });

        return Promise.reject(error);
      }
    );
  }
}
