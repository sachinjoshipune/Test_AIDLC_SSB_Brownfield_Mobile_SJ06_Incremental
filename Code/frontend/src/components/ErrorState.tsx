import React, {useCallback, useRef} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useDispatch, useStore} from 'react-redux';
import type {AppDispatch, RootState} from '../store/store';
import {navigateToHome} from '../navigation/navigationActions';
import {emitAuditEvent} from '../audit/auditEmitter';
import {useDirection, rtlDirectionStyle} from '../i18n/useDirection';

/**
 * US-006/US-007/US-008/US-025: Generic, localized error view shown instead of
 * a blank screen on any navigation/screen load failure. Offers Retry
 * (throttled, NFR-REL-003) and Return to Home (always allowed).
 */

const MIN_RETRY_INTERVAL_MS = 2000;
const MAX_RETRIES_PER_WINDOW = 3;
const RETRY_WINDOW_MS = 60000;

export interface ErrorStateProps {
  /** The original failed operation; re-invoked by Retry (US-007). */
  onRetry: () => void | Promise<void>;
  /** Route identifier used for audit/throttle bookkeeping (e.g. 'navigation/config', sectionId). */
  route: string;
}

export function ErrorState({onRetry, route}: ErrorStateProps): React.JSX.Element {
  const {t} = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const direction = useDirection();

  const lastRetryAtRef = useRef<number>(0);
  const retryTimestampsRef = useRef<number[]>([]);

  const handleRetry = useCallback(() => {
    const now = Date.now();

    // NFR-REL-003: throttle rapid repeated taps to a minimum interval.
    if (now - lastRetryAtRef.current < MIN_RETRY_INTERVAL_MS) {
      return;
    }

    // Section 6.1: Retry attempt count < 3 within a 60s window.
    retryTimestampsRef.current = retryTimestampsRef.current.filter(
      ts => now - ts < RETRY_WINDOW_MS,
    );
    if (retryTimestampsRef.current.length >= MAX_RETRIES_PER_WINDOW) {
      emitAuditEvent('nav.transition.rejected', {reason: 'retry_throttled', route});
      return;
    }

    lastRetryAtRef.current = now;
    retryTimestampsRef.current.push(now);

    emitAuditEvent('nav.screen.retry', {route});
    void onRetry();
  }, [onRetry, route]);

  const handleReturnHome = useCallback(() => {
    navigateToHome(dispatch, store.getState);
  }, [dispatch, store]);

  return (
    <View style={[styles.container, direction === 'RTL' ? rtlDirectionStyle : undefined]}>
      <Text style={styles.message}>{t('error.generic')}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handleRetry}
          accessibilityRole="button"
          testID="error-state-retry">
          <Text style={styles.buttonPrimaryText}>{t('error.retry')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleReturnHome}
          accessibilityRole="button"
          testID="error-state-return-home">
          <Text style={styles.buttonSecondaryText}>{t('error.returnHome')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#444444',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonPrimary: {
    backgroundColor: '#1565C0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonSecondaryText: {
    color: '#333333',
    fontWeight: '600',
  },
});

export default ErrorState;
