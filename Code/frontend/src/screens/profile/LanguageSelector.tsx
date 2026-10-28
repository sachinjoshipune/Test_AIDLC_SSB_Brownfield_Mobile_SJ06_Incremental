import React, {useCallback} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import type {AppDispatch, RootState} from '../../store/store';
import type {SupportedLocale} from '../../store/localeSlice';
import {saveLanguagePreference} from '../../profile/languagePreferenceService';
import {useDirection, isRTL, rtlDirectionStyle} from '../../i18n/useDirection';

/**
 * US-011: Renders the two supported locales (English/Arabic) on the My
 * Profile screen and dispatches a locale-change on selection. Wires directly
 * into languagePreferenceService (US-012) and i18n.changeLanguage (US-014)
 * for instant, same-render-cycle application (via Redux + react-i18next).
 */

const SUPPORTED_LOCALES: {code: SupportedLocale; labelKey: string}[] = [
  {code: 'en', labelKey: 'profile.english'},
  {code: 'ar', labelKey: 'profile.arabic'},
];

export function LanguageSelector(): React.JSX.Element {
  const {t} = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const direction = useDirection();
  const currentLocale = useSelector((state: RootState) => state.locale.locale);

  const handleSelect = useCallback(
    (code: SupportedLocale) => {
      if (code === currentLocale) {
        return;
      }
      void saveLanguagePreference(dispatch, code);
    },
    [currentLocale, dispatch],
  );

  return (
    <View
      style={[styles.container, isRTL(direction) ? rtlDirectionStyle : undefined]}
      testID="language-selector">
      <Text style={styles.title}>{t('profile.languageSectionTitle')}</Text>
      <Text style={styles.label}>{t('profile.languageSelectorLabel')}</Text>
      <View style={styles.options}>
        {SUPPORTED_LOCALES.map(option => {
          const selected = option.code === currentLocale;
          return (
            <TouchableOpacity
              key={option.code}
              style={[styles.option, selected ? styles.optionSelected : undefined]}
              accessibilityRole="radio"
              accessibilityState={{selected}}
              testID={`language-option-${option.code}`}
              onPress={() => handleSelect(option.code)}>
              <Text style={[styles.optionText, selected ? styles.optionTextSelected : undefined]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 12,
  },
  options: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BDBDBD',
  },
  optionSelected: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  optionText: {
    color: '#424242',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default LanguageSelector;
