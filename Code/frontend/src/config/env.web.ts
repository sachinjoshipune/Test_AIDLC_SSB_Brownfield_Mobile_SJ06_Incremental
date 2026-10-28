/**
 * Web platform variant of env.ts.
 *
 * `react-native-config` reads native-side `.env.*` files at native build time
 * (via Gradle/Xcode build phases) and has no web bundler integration, so it
 * cannot be resolved by Metro's web bundler. This file is picked up
 * automatically for the `web` platform (standard React Native
 * platform-specific extension resolution) so that `expo start --web` can
 * bundle successfully.
 *
 * For local web dev-preview, values may be overridden via Expo's standard
 * `EXPO_PUBLIC_*` env vars (loaded from a `.env` file or the shell into
 * `process.env` by `expo/metro-config`); otherwise this falls back to the
 * same placeholder values as `.env.development` (see Specifications
 * Section 8.1/AC-022 — no hardcoded host is used for native builds, which
 * continue to resolve env.ts via react-native-config as before).
 */
import type {AppEnv} from './env';

// Minimal ambient declaration so this web-only file doesn't require pulling
// in full @types/node (which would also add unrelated Node globals to the
// native TypeScript project). Metro/webpack inline `process.env.*` access
// for web bundles; this is standard practice (Expo's own types use the same
// pattern for `process.env.EXPO_*`).
declare const process: {env: Record<string, string | undefined>};

const DEFAULT_TIMEOUT_MS = 10000;
const DEV_PLACEHOLDER_API_BASE_URL = 'https://dev-api.sb360.example.invalid';

/**
 * Section 9/AC-022 forbids cleartext HTTP for real endpoints. The one
 * narrow, standard exception made here (web dev-preview build only) is
 * plain `http://localhost` / `http://127.0.0.1`, so this file can point at a
 * local mock backend (see `dev-mock-server/`) without requiring a
 * self-signed TLS cert for local-only preview traffic. Any non-local host
 * still must use HTTPS, same as the native build.
 */
function isLocalHttpException(url: string): boolean {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(url);
}

export function getEnv(): AppEnv {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || DEV_PLACEHOLDER_API_BASE_URL;

  if (!apiBaseUrl.startsWith('https://') && !isLocalHttpException(apiBaseUrl)) {
    throw new Error(`API_BASE_URL must use HTTPS. Received: ${apiBaseUrl}`);
  }

  const apiTimeoutMs = process.env.EXPO_PUBLIC_API_TIMEOUT_MS
    ? parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, 10)
    : DEFAULT_TIMEOUT_MS;

  return {
    apiBaseUrl,
    apiTimeoutMs: Number.isNaN(apiTimeoutMs) ? DEFAULT_TIMEOUT_MS : apiTimeoutMs,
    environmentName: process.env.EXPO_PUBLIC_ENVIRONMENT_NAME || 'development-web-preview',
  };
}

export default getEnv;
