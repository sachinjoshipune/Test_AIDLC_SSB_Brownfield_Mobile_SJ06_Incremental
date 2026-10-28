import {useEffect} from 'react';
import {I18nManager, Platform} from 'react-native';
import {useSelector} from 'react-redux';
import type {RootState} from '../store/store';
import type {LayoutDirection} from '../store/localeSlice';

/**
 * Exposes the current layout direction (RTL/LTR), derived from the active
 * locale in Redux (localeSlice.direction), per Specifications/currentspec.md
 * Section 6.2 (UILayoutDirection state machine) and US-015.
 *
 * Also synchronizes React Native's I18nManager so native RTL layout behavior
 * (flex direction, text alignment) is applied atomically alongside the locale
 * change - avoiding a "partially-mirrored" intermediate state.
 */
export function useDirection(): LayoutDirection {
  const direction = useSelector((state: RootState) => state.locale.direction);

  useEffect(() => {
    const shouldBeRTL = direction === 'RTL';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(shouldBeRTL);
      // Note: a full RTL flip via I18nManager.forceRTL typically requires an
      // app reload to take effect natively on some platforms. Our Redux-driven
      // `direction` value is applied immediately to all style lookups in this
      // session via isRTL() below, so visible layout mirrors without requiring
      // an app restart (US-014/US-015), while I18nManager stays in sync for
      // future cold starts.
    }
  }, [direction]);

  return direction;
}

export function isRTL(direction: LayoutDirection): boolean {
  return direction === 'RTL';
}

/**
 * Per-view `direction: 'rtl'` style override, used alongside the global
 * I18nManager-driven mirroring for an explicit per-container guarantee.
 * `direction` is a valid Yoga/RN layout style on iOS/Android (see
 * react-native's StyleSheetTypes), but `react-native-web` does not implement
 * it and logs a dev-only console warning ("Did you mean 'writingDirection'?")
 * when it's set. It's omitted on web (dev-preview via `expo start --web`)
 * purely to silence that cosmetic warning; native builds are unaffected.
 */
export const rtlDirectionStyle = Platform.select({
  web: {},
  default: {direction: 'rtl' as const},
});

export default useDirection;
