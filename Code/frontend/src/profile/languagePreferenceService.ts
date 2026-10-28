import {request, isApiError} from '../api/client';
import {setLocalItem, getLocalItem} from '../storage/localStorage';
import {getSecureItem} from '../storage/secureStorage';
import type {AppDispatch} from '../store/store';
import {setLocale, setSyncState, SupportedLocale} from '../store/localeSlice';
import {emitAuditEvent} from '../audit/auditEmitter';
import i18n from '../i18n';

/**
 * US-012: Saves a language selection to local storage (non-PII preference,
 * Section 7.2) immediately, and PUTs it to API-003
 * (PUT /api/v1/profile/language) via the single F2 client when the visitor is
 * online/authenticated. Routes exclusively through `request()` (US-020).
 */

interface LanguagePreferenceResponse {
  userId: string;
  language: SupportedLocale;
  updatedAt: string;
}

export async function saveLanguagePreference(
  dispatch: AppDispatch,
  locale: SupportedLocale,
): Promise<void> {
  // 1. Always persist locally first (non-PII, AsyncStorage is appropriate here).
  await setLocalItem('languagePreference', locale);

  // 2. Apply immediately in-session (US-014), atomically flipping direction
  //    alongside locale (US-015: no partial-mirror intermediate state).
  dispatch(setLocale(locale));
  await i18n.changeLanguage(locale);
  emitAuditEvent('profile.language.changed', {to: locale});
  emitAuditEvent('ui.direction.changed', {to: locale === 'ar' ? 'RTL' : 'LTR'});

  // 3. Attempt to sync to backend only if we have an auth token (authenticated visitor).
  const token = await getSecureItem('authToken');
  const userId = await getSecureItem('userId');

  if (!token || !userId) {
    // Not authenticated: defer sync (Section 6.2: persist_deferred).
    await setLocalItem('languagePendingSync', true);
    dispatch(setSyncState('pending_sync'));
    emitAuditEvent('profile.language.persist_deferred', {reason: 'unauthenticated'});
    return;
  }

  try {
    await request<LanguagePreferenceResponse>({
      url: '/api/v1/profile/language',
      method: 'PUT',
      data: {userId, language: locale},
    });
    await setLocalItem('languagePendingSync', false);
    dispatch(setSyncState('synced'));
    emitAuditEvent('profile.language.persisted', {});
  } catch (error) {
    const reasonCode = isApiError(error) ? error.reasonCode : 'UNKNOWN';
    await setLocalItem('languagePendingSync', true);
    dispatch(setSyncState('pending_sync'));
    emitAuditEvent('profile.language.persist_deferred', {reason: reasonCode});
  }
}

export async function getPendingSyncFlag(): Promise<boolean> {
  return (await getLocalItem<boolean>('languagePendingSync')) ?? false;
}

export default {saveLanguagePreference, getPendingSyncFlag};
