// Assumed: react-native-config exposes values from the active .env.* file at build time.
// Not specified in inputs beyond Section 8.1 (react-native-config) — implemented per that decision.
import Config from 'react-native-config';

export interface AppEnv {
  apiBaseUrl: string;
  apiTimeoutMs: number;
  environmentName: string;
}

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Resolves the backend base URL and related config strictly from environment
 * variables injected by react-native-config (.env.development / .env.staging /
 * .env.production). No hardcoded host is permitted (AC-022, Section 8.2).
 */
export function getEnv(): AppEnv {
  const apiBaseUrl = Config.API_BASE_URL;
  if (!apiBaseUrl) {
    // Fail loudly rather than silently falling back to a hardcoded host, per
    // Section 9 (no cleartext/undeclared endpoints) and AC-022.
    throw new Error(
      'API_BASE_URL is not configured. Ensure the active .env file defines API_BASE_URL.',
    );
  }

  if (!apiBaseUrl.startsWith('https://')) {
    // Section 9: no cleartext HTTP traffic permitted in any build configuration.
    throw new Error(
      `API_BASE_URL must use HTTPS. Received: ${apiBaseUrl}`,
    );
  }

  const apiTimeoutMs = Config.API_TIMEOUT_MS
    ? parseInt(Config.API_TIMEOUT_MS, 10)
    : DEFAULT_TIMEOUT_MS;

  return {
    apiBaseUrl,
    apiTimeoutMs: Number.isNaN(apiTimeoutMs) ? DEFAULT_TIMEOUT_MS : apiTimeoutMs,
    environmentName: Config.ENVIRONMENT_NAME || 'development',
  };
}

export default getEnv;
