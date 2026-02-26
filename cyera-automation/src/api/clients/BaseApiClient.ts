import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from 'axios';
import { logger } from 'logger';

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

    // Request interceptor — log every outgoing request with payload preview
    this.http.interceptors.request.use((config) => {
      const { method, baseURL, url, data, params } = config;

      logger.info(`API Request: ${method?.toUpperCase()} ${baseURL}${url}`, {
        method: method?.toUpperCase(),
        url: `${baseURL}${url}`,
        data,
        params,
      });

      return config;
    });

    // Response interceptor — log every response with a safe body preview
    this.http.interceptors.response.use(
      (response: AxiosResponse) => {
        const { status, data } = response;
        const method = response.config.method?.toUpperCase();
        const url = response.config.url;
        const fullUrl = `${response.config.baseURL ?? ''}${url ?? ''}`;

        logger.info(`API Response: ${status} ${method} ${fullUrl}`, {
          status,
          method,
          url: fullUrl,
          bodyPreview: this.safeJsonPreview(data),
        });

        return response;
      },
      (error: AxiosError) => {
        const status = error.response?.status ?? 'NETWORK_ERROR';
        const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN';
        const url = error.config?.url ?? 'UNKNOWN';
        const baseURL = error.config?.baseURL ?? '';
        const fullUrl = `${baseURL}${url}`;
        const responseData = error.response?.data;

        logger.error(`API Error: ${status} ${method} ${fullUrl}`, {
          status,
          method,
          url: fullUrl,
          bodyPreview: this.safeJsonPreview(responseData),
        });

        return Promise.reject(error);
      },
    );
  }

  private safeJsonPreview(value: unknown, maxLength = 500): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    try {
      const str = JSON.stringify(value);
      if (str.length <= maxLength) {
        return str;
      }
      return `${str.slice(0, maxLength)}…`;
    } catch {
      return '[unserializable]';
    }
  }

  protected async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.http.request<T>({
      method: 'GET',
      url,
      ...config,
    });
  }

  protected async post<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.http.request<T>({
      method: 'POST',
      url,
      ...config,
    });
  }

  protected async put<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.http.request<T>({
      method: 'PUT',
      url,
      ...config,
    });
  }

  protected async patch<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.http.request<T>({
      method: 'PATCH',
      url,
      ...config,
    });
  }

  protected async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.http.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }
}
