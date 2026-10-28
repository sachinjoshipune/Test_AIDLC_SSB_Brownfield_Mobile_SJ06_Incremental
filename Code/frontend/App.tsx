import React, {useEffect} from 'react';
import {Provider} from 'react-redux';
import store from './src/store/store';
import './src/i18n';
import i18n from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import {rehydrateActiveTabFromStorage} from './src/navigation/persistTab';
import {attachSessionInterceptors, initSessionManager} from './src/auth/sessionManager';
import {startLanguageSyncQueue} from './src/profile/languageSyncQueue';
import {getLocalItem} from './src/storage/localStorage';
import {setLocale, SupportedLocale} from './src/store/localeSlice';

/**
 * Root application entry (Code/frontend/App.tsx). Wires together:
 *  - Redux store (navigation + locale slices)
 *  - i18n bootstrap (device-locale detection, en/ar bundles)
 *  - Session manager (401 reset handling, NFR-SEC-007)
 *  - Active-tab rehydration (US-004)
 *  - Language sync queue (US-013, reconnect-triggered retry)
 *  - Root bottom-tab navigator hosting the persistent BottomNavBar (US-001)
 */
function AppBootstrap(): React.JSX.Element {
  useEffect(() => {
    const deviceLocale = (i18n.language?.startsWith('ar') ? 'ar' : 'en') as SupportedLocale;
    initSessionManager(store.dispatch, deviceLocale);
    attachSessionInterceptors();
    startLanguageSyncQueue(store.dispatch);

    void (async () => {
      await rehydrateActiveTabFromStorage(store.dispatch);

      // Restore any previously-saved language preference (non-PII, AsyncStorage)
      // so the UI reflects it immediately on cold start, ahead of ProfileScreen's
      // own fetch-from-backend initialization (US-017).
      const savedLocale = await getLocalItem<SupportedLocale>('languagePreference');
      if (savedLocale) {
        store.dispatch(setLocale(savedLocale));
        await i18n.changeLanguage(savedLocale);
      }
    })();
  }, []);

  return <RootNavigator />;
}

export function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <AppBootstrap />
    </Provider>
  );
}

export default App;
