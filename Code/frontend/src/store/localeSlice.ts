import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type SupportedLocale = 'en' | 'ar';
export type LayoutDirection = 'LTR' | 'RTL';
export type SyncState = 'synced' | 'pending_sync';

/**
 * LocalePreference state machine per Specifications/currentspec.md Section 6.2.
 */
export interface LocaleState {
  locale: SupportedLocale;
  direction: LayoutDirection;
  syncState: SyncState;
}

const initialState: LocaleState = {
  locale: 'en',
  direction: 'LTR',
  syncState: 'synced',
};

function directionFor(locale: SupportedLocale): LayoutDirection {
  return locale === 'ar' ? 'RTL' : 'LTR';
}

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    /**
     * Applies locale + direction atomically (US-015: no partially-mirrored state).
     */
    setLocale(state, action: PayloadAction<SupportedLocale>) {
      state.locale = action.payload;
      state.direction = directionFor(action.payload);
    },
    setSyncState(state, action: PayloadAction<SyncState>) {
      state.syncState = action.payload;
    },
    /** NFR-SEC-007: reset to device-detected default locale on auth failure. */
    resetToDeviceDefault(state, action: PayloadAction<SupportedLocale>) {
      state.locale = action.payload;
      state.direction = directionFor(action.payload);
      state.syncState = 'synced';
    },
  },
});

export const {setLocale, setSyncState, resetToDeviceDefault} = localeSlice.actions;
export default localeSlice.reducer;
