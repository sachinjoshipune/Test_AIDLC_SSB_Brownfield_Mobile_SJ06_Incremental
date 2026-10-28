import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage-backed storage for NON-SENSITIVE data only.
 * Per Specifications/currentspec.md Section 7.2, permitted values here:
 *   - language preference
 *   - cached navigation config (NavigationItem[])
 *   - activeTabId / SessionState (non-PII)
 *   - sync-deferred flags
 *
 * PII (email, displayName) and tokens MUST use secureStorage.ts instead (US-024).
 */

export type LocalStorageKey =
  | 'languagePreference'
  | 'languageSyncState'
  | 'languagePendingSync'
  | 'cachedNavConfig'
  | 'activeTabId'
  | 'lastVisitedRoute';

export async function setLocalItem<T>(key: LocalStorageKey, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getLocalItem<T>(key: LocalStorageKey): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function removeLocalItem(key: LocalStorageKey): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/** Clears all non-sensitive local cache (explicit logout). */
export async function clearAllLocalData(): Promise<void> {
  const keys: LocalStorageKey[] = [
    'languagePreference',
    'languageSyncState',
    'languagePendingSync',
    'cachedNavConfig',
    'activeTabId',
    'lastVisitedRoute',
  ];
  await AsyncStorage.multiRemove(keys);
}

export default {
  setLocalItem,
  getLocalItem,
  removeLocalItem,
  clearAllLocalData,
};
