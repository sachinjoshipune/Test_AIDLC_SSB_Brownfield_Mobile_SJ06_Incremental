import React, {useEffect} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector, useStore} from 'react-redux';
import type {AppDispatch, RootState} from '../store/store';
import {loadNavigationConfig, retryLoadNavigationConfig} from './navConfigService';
import {navigateToTab} from './navigationActions';
import {useDirection, isRTL} from '../i18n/useDirection';
import {ErrorState} from '../components/ErrorState';

/**
 * US-001: Persistent Bottom Navigation Bar (276x53dp per design spec),
 * mounted at the root navigator level (see App.tsx) so it renders on every
 * primary screen. Fetches its items via navConfigService (F2 client, US-005),
 * reflects active-tab state from Redux (US-003), uses i18n keys for all
 * labels with zero hardcoded strings (US-010/US-025), and mirrors layout for
 * RTL (US-015).
 */

/**
 * Maps a NavigationItem.id to its i18n translation key. Falls back to the raw
 * id (wrapped so it is still routed through `t()`) for any unexpected id so
 * no literal label string is ever rendered directly (US-010/AC-025).
 */
function labelKeyFor(id: string): string {
  const known = ['explore', 'map', 'plan', 'profile'];
  return known.includes(id) ? `nav.${id}` : `nav.${id}`;
}

export function BottomNavBar(): React.JSX.Element {
  const {t} = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const direction = useDirection();
  const locale = useSelector((state: RootState) => state.locale.locale);
  const {items, activeTabId, loading, error} = useSelector(
    (state: RootState) => state.navigation,
  );

  useEffect(() => {
    void loadNavigationConfig(dispatch, locale);
    // Re-fetch when locale changes so labels/icons reflect the active language
    // where the backend supports localized nav config (API-001 locale param).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, locale]);

  const handleRetry = () => retryLoadNavigationConfig(dispatch, locale);

  if (error && items.length === 0) {
    return <ErrorState onRetry={handleRetry} route="navigation/config" />;
  }

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <View
      style={[styles.container, isRTL(direction) ? styles.containerRTL : undefined]}
      testID="bottom-nav-bar">
      {sortedItems.map(item => {
        const active = item.id === activeTabId;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            testID={`nav-tab-${item.id}`}
            onPress={() => navigateToTab(dispatch, store.getState, item.id)}>
            <Text style={[styles.label, active ? styles.labelActive : undefined]}>
              {t(labelKeyFor(item.id))}
            </Text>
          </TouchableOpacity>
        );
      })}
      {loading && sortedItems.length === 0 ? (
        <Text style={styles.loadingText}>{t('section.loading')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 276,
    height: 53,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignSelf: 'center',
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  label: {
    fontSize: 12,
    color: '#757575',
  },
  labelActive: {
    color: '#1565C0',
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 10,
    color: '#9E9E9E',
  },
});

export default BottomNavBar;
