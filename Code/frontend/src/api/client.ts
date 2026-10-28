import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import {getEnv} from '../config/env';

/**
 * Generic, UI-safe error contract. Per Specifications/currentspec.md Section 9
 * ("Error message hygiene"), raw stack traces / internal codes are never exposed
 * to calling UI code - only this shape is surfaced.
 */
export interface ApiError {
  /** HTTP status code if available, or 0 for network/timeout errors. */
  status: number;
  /** Generic, localization-key-friendly reason code (not a raw backend message). */
  reasonCode:
    | 'TIMEOUT'
    | 'NETWORK_ERROR'
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'SERVER_ERROR'
    | 'UNKNOWN';
  /** Original request path, useful for Retry (US-007) without exposing internals. */
  path?: string;
}

function mapErrorToApiError(error: AxiosError): ApiError {
  const path = error.config?.url;

  if (error.code === 'ECONNABORTED') {
    return {status: 0, reasonCode: 'TIMEOUT', path};
  }

  if (!error.response) {
    return {status: 0, reasonCode: 'NETWORK_ERROR', path};
  }

  const status = error.response.status;
  switch (status) {
    case 400:
      return {status, reasonCode: 'BAD_REQUEST', path};
    case 401:
      return {status, reasonCode: 'UNAUTHORIZED', path};
    case 403:
      return {status, reasonCode: 'FORBIDDEN', path};
    case 404:
      return {status, reasonCode: 'NOT_FOUND', path};
    case 409:
      return {status, reasonCode: 'CONFLICT', path};
    default:
      return status >= 500
        ? {status, reasonCode: 'SERVER_ERROR', path}
        : {status, reasonCode: 'UNKNOWN', path};
  }
}

/**
 * Single, centralized HTTP client module (AC-020). All API-00x calls in this
 * application MUST go through `apiClient` - no feature module may construct
 * its own axios/fetch instance (US-020).
 */
function createApiClient(): AxiosInstance {
  const env = getEnv();

  const instance = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: env.apiTimeoutMs,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => Promise.reject(mapErrorToApiError(error)),
  );

  return instance;
}

export const apiClient: AxiosInstance = createApiClient();

/**
 * Thin typed wrapper so callers get a consistent {data, error} shape and never
 * need to touch axios types directly. Supports the auth interceptor (F5) being
 * layered on via `apiClient.interceptors.request`.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'reasonCode' in value &&
    'status' in value
  );
}

export default apiClient;
