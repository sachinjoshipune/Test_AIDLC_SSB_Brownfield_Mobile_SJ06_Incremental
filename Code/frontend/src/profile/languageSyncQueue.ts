import NetInfo from '@react-native-community/netinfo';
import {getLocalItem} from '../storage/localStorage';
import {getSecureItem} from '../storage/secureStorage';
import {request, isApiError} from '../api/client';
import type {AppDispatch} from '../store/store';
import {setSyncState, SupportedLocale} from '../store/localeSlice';
import {emitAuditEvent} from '../audit/auditEmitter';

/**
 * US-013: Queues a deferred language-preference sync (set by
 * languagePreferenceService when offline/unauthenticated) and automatically
 * retries it once network connectivity is restored (Section 6.2:
 * `pending_sync` -> `synced`).
 */

interface LanguagePreferenceResponse {
  userId: string;
  language: SupportedLocale;
  updatedAt: string;
}

let unsubscribe: (() => void) | null = null;
let syncing = false;

async function attemptPendingSync(dispatch: AppDispatch): Promise<void> {
  if (syncing) {
    return;
  }

  const pending = await getLocalItem<boolean>('languagePendingSync');
  if (!pending) {
    return;
  }

  const locale = await getLocalItem<SupportedLocale>('languagePreference');
  const token = await getSecureItem('authToken');
  const userId = await getSecureItem('userId');

  if (!locale || !token || !userId) {
    // Still unauthenticated or no pending value; nothing to sync yet.
    return;
  }

  syncing = true;
  try {
    await request<LanguagePreferenceResponse>({
      url: '/api/v1/profile/language',
      method: 'PUT',
      data: {userId, language: locale},
    });
    dispatch(setSyncState('synced'));
    emitAuditEvent('profile.language.sync_resolved', {});
  } catch (error) {
    const reasonCode = isApiError(error) ? error.reasonCode : 'UNKNOWN';
    // Leave pending_sync flag set; will retry on next reconnect event.
    emitAuditEvent('profile.language.persist_deferred', {reason: reasonCode});
  } finally {
    syncing = false;
  }
}

/**
 * Starts listening for network reconnect events and attempts to flush any
 * deferred language-preference sync. Call once during app bootstrap.
 */
export function startLanguageSyncQueue(dispatch: AppDispatch): void {
  if (unsubscribe) {
    return;
  }

  unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      void attemptPendingSync(dispatch);
    }
  });
}

export function stopLanguageSyncQueue(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export default {startLanguageSyncQueue, stopLanguageSyncQueue};
