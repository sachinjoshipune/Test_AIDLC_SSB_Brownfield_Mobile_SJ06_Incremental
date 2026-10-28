import {apiClient} from '../api/client';
import {getSecureItem, clearAllSecureData} from '../storage/secureStorage';
import {clearAllLocalData} from '../storage/localStorage';
import type {AppDispatch} from '../store/store';
import {resetToSafeDefault} from '../store/navigationSlice';
import {resetToDeviceDefault} from '../store/localeSlice';
import {emitAuditEvent} from '../audit/auditEmitter';

/**
 * Session/auth module built on top of the single F2 `apiClient` (AC-020).
 * Responsibilities:
 *  - Attach the Bearer token to outgoing requests (Section 8.2).
 *  - On ANY 401 response, clear stored tokens/session state and reset
 *    navigation + locale to safe defaults (NFR-SEC-007).
 */

let dispatchRef: AppDispatch | null = null;
let deviceDefaultLocale: 'en' | 'ar' = 'en';

/**
 * Must be called once during app bootstrap (App.tsx) so this module can
 * dispatch resets into the Redux store without introducing a circular import
 * between the store and the session manager.
 */
export function initSessionManager(dispatch: AppDispatch, detectedDeviceLocale: 'en' | 'ar'): void {
  dispatchRef = dispatch;
  deviceDefaultLocale = detectedDeviceLocale;
}

let requestInterceptorId: number | null = null;
let responseInterceptorId: number | null = null;

/**
 * Clears all secure/local session data and resets app state to safe defaults.
 * Called on any 401 response (NFR-SEC-007) and may also be invoked for an
 * explicit user logout.
 */
export async function resetSession(): Promise<void> {
  await clearAllSecureData();
  await clearAllLocalData();
  if (dispatchRef) {
    dispatchRef(resetToSafeDefault());
    dispatchRef(resetToDeviceDefault(deviceDefaultLocale));
  }
}

export function attachSessionInterceptors(): void {
  if (requestInterceptorId !== null) {
    // Already attached; avoid double-registration on hot reload.
    return;
  }

  requestInterceptorId = apiClient.interceptors.request.use(async config => {
    const token = await getSecureItem('authToken');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  responseInterceptorId = apiClient.interceptors.response.use(
    response => response,
    async error => {
      // The F2 client's own interceptor maps AxiosError -> ApiError with a
      // `status` field; this interceptor is registered to run first in the
      // chain (request/response interceptors run in LIFO for errors), but to
      // be resilient to ordering we check both raw Axios errors and mapped
      // ApiErrors for status 401.
      const status = error?.response?.status ?? error?.status;
      if (status === 401) {
        await resetSession();
        emitAuditEvent('nav.transition.rejected', {reason: 'session_expired'});
      }
      return Promise.reject(error);
    },
  );
}

export function detachSessionInterceptors(): void {
  if (requestInterceptorId !== null) {
    apiClient.interceptors.request.eject(requestInterceptorId);
    requestInterceptorId = null;
  }
  if (responseInterceptorId !== null) {
    apiClient.interceptors.response.eject(responseInterceptorId);
    responseInterceptorId = null;
  }
}

export default {
  initSessionManager,
  attachSessionInterceptors,
  detachSessionInterceptors,
  resetSession,
};
