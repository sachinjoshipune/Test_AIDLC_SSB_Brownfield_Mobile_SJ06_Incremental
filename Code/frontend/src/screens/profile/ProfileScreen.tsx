import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useDispatch} from 'react-redux';
import {request} from '../../api/client';
import {ErrorState} from '../../components/ErrorState';
import {LanguageSelector} from './LanguageSelector';
import {useDirection, rtlDirectionStyle} from '../../i18n/useDirection';
import type {AppDispatch} from '../../store/store';
import {setLocale, SupportedLocale} from '../../store/localeSlice';
import {setSecureItem} from '../../storage/secureStorage';
import i18n from '../../i18n';

/**
 * US-017: Fetches the visitor's profile via API-004 (GET /api/v1/profile/me)
 * through the single F2/F5 client (auth interceptor attaches the Bearer
 * token), and initializes LanguageSelector's selected value from the
 * response's `language` field.
 *
 * US-024: email/displayName (PII) are written only to secureStorage, never
 * localStorage - this screen never persists those fields to AsyncStorage.
 */

interface ProfileResponse {
  userId: string;
  displayName: string;
  language: SupportedLocale;
  email: string;
}

export function ProfileScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const direction = useDirection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const profile = await request<ProfileResponse>({
        url: '/api/v1/profile/me',
        method: 'GET',
      });

      // US-024: PII fields go to secureStorage ONLY, never AsyncStorage.
      await setSecureItem('userId', profile.userId);
      await setSecureItem('displayName', profile.displayName);
      await setSecureItem('email', profile.email);

      // Initialize the language selector / i18n from the saved server value
      // (US-017) - non-PII preference, safe to reflect into Redux + i18next.
      dispatch(setLocale(profile.language));
      await i18n.changeLanguage(profile.language);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  if (error) {
    return <ErrorState onRetry={fetchProfile} route="profile/me" />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>{t('profile.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, direction === 'RTL' ? rtlDirectionStyle : undefined]}>
      <LanguageSelector />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#757575',
  },
});

export default ProfileScreen;
