import * as Keychain from 'react-native-keychain';

/**
 * Keychain/Keystore-backed storage for PII and tokens ONLY.
 * Per Specifications/currentspec.md Section 7.2:
 *   - email (PII, direct identifier)
 *   - displayName (PII, indirect identifier)
 *   - Bearer tokens (never AsyncStorage / logs)
 *
 * Do NOT use this module for non-sensitive preference data (see localStorage.ts).
 */

export type SecureKey = 'authToken' | 'userId' | 'displayName' | 'email';

interface SecureRecord {
  key: SecureKey;
  value: string;
}

/**
 * Keychain only supports a single username/password pair per "service" by
 * default. We namespace each secure key as its own Keychain service so that
 * tokens and PII fields can be set/cleared independently.
 */
function serviceNameFor(key: SecureKey): string {
  return `sb360.secure.${key}`;
}

export async function setSecureItem(key: SecureKey, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, {service: serviceNameFor(key)});
}

export async function getSecureItem(key: SecureKey): Promise<string | null> {
  const result = await Keychain.getGenericPassword({service: serviceNameFor(key)});
  if (!result) {
    return null;
  }
  return result.password;
}

export async function removeSecureItem(key: SecureKey): Promise<void> {
  await Keychain.resetGenericPassword({service: serviceNameFor(key)});
}

/**
 * Clears all known secure keys. Used on logout and on 401/session-reset
 * (NFR-SEC-007) and on app uninstall relies on OS-managed Keychain teardown.
 */
export async function clearAllSecureData(): Promise<void> {
  const keys: SecureKey[] = ['authToken', 'userId', 'displayName', 'email'];
  await Promise.all(keys.map(key => removeSecureItem(key)));
}

export async function setSecureRecord(record: SecureRecord): Promise<void> {
  await setSecureItem(record.key, record.value);
}

export default {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  clearAllSecureData,
};
