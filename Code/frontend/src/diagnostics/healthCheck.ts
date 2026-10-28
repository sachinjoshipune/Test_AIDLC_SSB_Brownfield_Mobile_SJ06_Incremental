import {request, isApiError} from '../api/client';

/**
 * US-019: App diagnostics can confirm backend availability via API-006
 * (GET /api/v1/health). Uses the single F2 `apiClient`/`request` wrapper -
 * no separate HTTP call path is created (US-020).
 */

export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string;
}

export type BackendStatus = 'up' | 'down';

export interface DiagnosticsResult {
  status: BackendStatus;
  checkedAt: string;
  /** Present only when status is 'down'; a generic reason code, never raw errors. */
  reasonCode?: string;
}

/**
 * Calls API-006 and returns a simple up/down result for internal diagnostic
 * screens/logging. Never throws - callers always get a DiagnosticsResult.
 */
export async function checkBackendHealth(): Promise<DiagnosticsResult> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await request<HealthCheckResponse>({
      url: '/api/v1/health',
      method: 'GET',
    });
    return {
      status: response.status === 'ok' ? 'up' : 'down',
      checkedAt,
    };
  } catch (error) {
    return {
      status: 'down',
      checkedAt,
      reasonCode: isApiError(error) ? error.reasonCode : 'UNKNOWN',
    };
  }
}

export default checkBackendHealth;
