const {getDefaultConfig} = require('expo/metro-config');

/**
 * Metro configuration
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * Uses expo/metro-config (a superset of @react-native/metro-config) so the
 * project can be bundled both for native (iOS/Android, via React Native CLI)
 * and for web (via `expo start --web`, dev-preview tooling only).
 */
module.exports = getDefaultConfig(__dirname);
