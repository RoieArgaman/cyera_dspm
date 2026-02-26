import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from 'axios';
import {
  step as allureStep,
  attachment as allureAttachment,
} from 'allure-js-commons';
import { logger } from 'logger';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

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
      const { method, baseURL: cfgBaseUrl, url, data, params, headers } = config;

      logger.info(
        `API Request: ${method?.toUpperCase()} ${cfgBaseUrl ?? ''}${url ?? ''}`,
        {
          method: method?.toUpperCase(),
          url: `${cfgBaseUrl ?? ''}${url ?? ''}`,
          headers,
          params,
          bodyPreview: this.safeJsonPreview(data),
        },
      );

      return config;
    });

    // Response interceptor — log every response with a safe body preview
    this.http.interceptors.response.use(
      (response: AxiosResponse) => {
        const { status, data, headers } = response;
        const method = response.config.method?.toUpperCase();
        const url = response.config.url;
        const fullUrl = `${response.config.baseURL ?? ''}${url ?? ''}`;

        logger.info(`API Response: ${status} ${method} ${fullUrl}`, {
          status,
          method,
          url: fullUrl,
          headers,
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
        const responseHeaders = error.response?.headers;

        logger.error(`API Error: ${status} ${method} ${fullUrl}`, {
          status,
          method,
          url: fullUrl,
          headers: responseHeaders,
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

  private prettifyData(value: unknown, maxLength = 20_000): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    try {
      if (typeof value === 'string') {
        const parsed = JSON.parse(value);
        const pretty = JSON.stringify(parsed, null, 2);
        return pretty.length <= maxLength
          ? pretty
          : `${pretty.slice(0, maxLength)}…`;
      }

      const pretty = JSON.stringify(value, null, 2);
      return pretty.length <= maxLength
        ? pretty
        : `${pretty.slice(0, maxLength)}…`;
    } catch {
      const str = String(value);
      return str.length <= maxLength ? str : `${str.slice(0, maxLength)}…`;
    }
  }

  private prettifyHeaders(
    headers: Record<string, unknown> | undefined,
  ): string {
    if (!headers) {
      return '';
    }

    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  private async addRequestStep(
    method: HttpMethod,
    url: string,
    config: AxiosRequestConfig,
  ): Promise<void> {
    const { headers = {}, data = null, params = null } = config;

    await allureStep(`Making ${method} request to ${url}`, async () => {
      const requestHeaders = this.prettifyHeaders(
        headers as Record<string, unknown>,
      );

      await allureAttachment('Request Headers', requestHeaders, 'text/plain');

      if (params) {
        await allureAttachment(
          'Query Parameters',
          JSON.stringify(params, null, 2),
          'text/plain',
        );
      }

      if (data !== null && data !== undefined) {
        await allureAttachment(
          'Request Body',
          this.prettifyData(data),
          'application/json',
        );
      }
    });
  }

  private async addResponseStep(
    url: string,
    response: AxiosResponse,
  ): Promise<void> {
    await allureStep(
      `Received response from ${url} (${response.status})`,
      async () => {
        const responseHeaders = this.prettifyHeaders(
          response.headers as Record<string, unknown>,
        );

        await allureAttachment(
          'Response Headers',
          responseHeaders,
          'text/plain',
        );

        await allureAttachment(
          'Response Body',
          this.prettifyData(response.data),
          'application/json',
        );
      },
    );
  }

  protected async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const method: HttpMethod = 'GET';
    const requestConfig: AxiosRequestConfig = config ?? {};

    try {
      await this.addRequestStep(method, url, requestConfig);
    } catch {
      // ignore Allure errors
    }

    const response = await this.http.request<T>({
      method,
      url,
      ...requestConfig,
    });

    try {
      await this.addResponseStep(url, response);
    } catch {
      // ignore Allure errors
    }

    return response;
  }

  protected async post<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const method: HttpMethod = 'POST';
    const requestConfig: AxiosRequestConfig = config ?? {};

    try {
      await this.addRequestStep(method, url, requestConfig);
    } catch {
      // ignore Allure errors
    }

    const response = await this.http.request<T>({
      method,
      url,
      ...requestConfig,
    });

    try {
      await this.addResponseStep(url, response);
    } catch {
      // ignore Allure errors
    }

    return response;
  }

  protected async put<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const method: HttpMethod = 'PUT';
    const requestConfig: AxiosRequestConfig = config ?? {};

    try {
      await this.addRequestStep(method, url, requestConfig);
    } catch {
      // ignore Allure errors
    }

    const response = await this.http.request<T>({
      method,
      url,
      ...requestConfig,
    });

    try {
      await this.addResponseStep(url, response);
    } catch {
      // ignore Allure errors
    }

    return response;
  }

  protected async patch<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const method: HttpMethod = 'PATCH';
    const requestConfig: AxiosRequestConfig = config ?? {};

    try {
      await this.addRequestStep(method, url, requestConfig);
    } catch {
      // ignore Allure errors
    }

    const response = await this.http.request<T>({
      method,
      url,
      ...requestConfig,
    });

    try {
      await this.addResponseStep(url, response);
    } catch {
      // ignore Allure errors
    }

    return response;
  }

  protected async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const method: HttpMethod = 'DELETE';
    const requestConfig: AxiosRequestConfig = config ?? {};

    try {
      await this.addRequestStep(method, url, requestConfig);
    } catch {
      // ignore Allure errors
    }

    const response = await this.http.request<T>({
      method,
      url,
      ...requestConfig,
    });

    try {
      await this.addResponseStep(url, response);
    } catch {
      // ignore Allure errors
    }

    return response;
  }
}
