/**
 * Web platform variant of secureStorage.ts.
 *
 * `react-native-keychain` is a native-only module (iOS Keychain / Android
 * Keystore) with no web implementation, so Metro's web bundler cannot resolve
 * it. This file is picked up automatically for the `web` platform (standard
 * React Native platform-specific extension resolution:
 * https://reactnative.dev/docs/platform-specific-code#platform-specific-extensions)
 * so that `expo start --web` can bundle successfully.
 *
 * IMPORTANT: this in-memory implementation is for local dev-preview ONLY. It
 * provides none of the OS-level secure-storage guarantees required by
 * Specifications/currentspec.md Section 7.2 / NFR-SEC-007, and values do not
 * persist across a page reload. The native (iOS/Android) build continues to
 * use the real react-native-keychain-backed implementation in
 * secureStorage.ts, which is the only version shipped to a device.
 */

export type SecureKey = 'authToken' | 'userId' | 'displayName' | 'email';

interface SecureRecord {
  key: SecureKey;
  value: string;
}

const memoryStore = new Map<SecureKey, string>();

export async function setSecureItem(key: SecureKey, value: string): Promise<void> {
  memoryStore.set(key, value);
}

export async function getSecureItem(key: SecureKey): Promise<string | null> {
  return memoryStore.get(key) ?? null;
}

export async function removeSecureItem(key: SecureKey): Promise<void> {
  memoryStore.delete(key);
}

export async function clearAllSecureData(): Promise<void> {
  memoryStore.clear();
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
