import {request, isApiError} from '../api/client';
import {getLocalItem, setLocalItem} from '../storage/localStorage';
import type {AppDispatch} from '../store/store';
import {
  fetchNavConfigStart,
  fetchNavConfigSuccess,
  fetchNavConfigFailure,
  NavigationItem,
} from '../store/navigationSlice';
import {emitAuditEvent} from '../audit/auditEmitter';

/**
 * US-005: Fetches navigation config via API-001 on startup, caches it to
 * local storage (F3), and falls back to the cached copy if the fetch fails
 * (NFR-REL-002), rather than leaving BottomNavBar empty/blank (US-006).
 */

interface NavConfigResponse {
  items: NavigationItem[];
}

const CACHE_KEY = 'cachedNavConfig';

export async function loadNavigationConfig(dispatch: AppDispatch, locale: string): Promise<void> {
  dispatch(fetchNavConfigStart());
  emitAuditEvent('nav.screen.load.start', {route: 'navigation/config'});

  try {
    const response = await request<NavConfigResponse>({
      url: '/api/v1/navigation/config',
      method: 'GET',
      params: {locale},
    });

    dispatch(fetchNavConfigSuccess(response.items));
    await setLocalItem(CACHE_KEY, response.items);
    emitAuditEvent('nav.screen.load.success', {route: 'navigation/config'});
  } catch (error) {
    const reasonCode = isApiError(error) ? error.reasonCode : 'UNKNOWN';
    emitAuditEvent('nav.screen.load.failure', {
      route: 'navigation/config',
      errorCode: reasonCode,
    });

    const cached = await getLocalItem<NavigationItem[]>(CACHE_KEY);
    if (cached && cached.length > 0) {
      // NFR-REL-002: render from cache rather than showing a blank nav bar.
      dispatch(fetchNavConfigSuccess(cached));
    } else {
      dispatch(fetchNavConfigFailure(reasonCode));
    }
  }
}

/**
 * Re-invokes the same failed load, used by the Retry action (US-007).
 */
export async function retryLoadNavigationConfig(
  dispatch: AppDispatch,
  locale: string,
): Promise<void> {
  emitAuditEvent('nav.screen.retry', {route: 'navigation/config'});
  await loadNavigationConfig(dispatch, locale);
}

export default {loadNavigationConfig, retryLoadNavigationConfig};
