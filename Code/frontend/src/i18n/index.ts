import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import en from './locales/en.json';
import ar from './locales/ar.json';

export type SupportedLocaleCode = 'en' | 'ar';

const resources = {
  en: {translation: en},
  ar: {translation: ar},
} as const;

/**
 * Determines the initial locale from the device's locale settings, falling
 * back to English when the device locale is not one of the two supported
 * languages (Section 1.1: English/Arabic only).
 *
 * Assumption: the bundled resource JSON files are the authoritative source
 * (per Specifications/currentspec.md Section 1.3: "local bundle is
 * authoritative fallback"). Remote API-002 fetching is intentionally not
 * wired here as a hard dependency so the UI never blocks on network for
 * basic label rendering; a future enhancement could merge remote
 * `/api/v1/i18n/{locale}` namespaces on top of these bundles.
 */
function detectInitialLocale(): SupportedLocaleCode {
  const best = RNLocalize.findBestLanguageTag(['en', 'ar']);
  if (best && (best.languageTag.startsWith('ar') || best.languageTag.startsWith('en'))) {
    return best.languageTag.startsWith('ar') ? 'ar' : 'en';
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLocale(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'ar'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
