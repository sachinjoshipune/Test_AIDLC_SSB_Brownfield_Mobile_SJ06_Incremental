import {createSlice, PayloadAction} from '@reduxjs/toolkit';

/**
 * NavigationItem mirrors the shape returned by API-001 (GET /api/v1/navigation/config).
 * See Specifications/currentspec.md Section 7.1 (NavigationItem entity).
 */
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  order: number;
}

export interface NavigationState {
  /** Ordered list of nav items sourced from API-001, cached for offline resilience. */
  items: NavigationItem[];
  /** The currently active tab id (US-003: exactly one tab active at a time). */
  activeTabId: string | null;
  /** Whether the nav config load is in flight. */
  loading: boolean;
  /** Set when the startup/refresh fetch failed (US-006, US-005 NFR-REL-002). */
  error: string | null;
  /** True once a persisted activeTabId has been rehydrated (US-004). */
  rehydrated: boolean;
}

const initialState: NavigationState = {
  items: [],
  activeTabId: null,
  loading: false,
  error: null,
  rehydrated: false,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    fetchNavConfigStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchNavConfigSuccess(state, action: PayloadAction<NavigationItem[]>) {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
      // If no active tab is set yet, default to the first item by order (safe default: Explore).
      if (!state.activeTabId && action.payload.length > 0) {
        const sorted = [...action.payload].sort((a, b) => a.order - b.order);
        state.activeTabId = sorted[0].id;
      }
    },
    fetchNavConfigFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    /**
     * US-003: Enforces single-active-tab invariant. Previous active tab is implicitly
     * deactivated because activeTabId is a single scalar value, not a per-item flag.
     */
    setActiveTab(state, action: PayloadAction<string>) {
      const exists = state.items.some(item => item.id === action.payload);
      if (exists || state.items.length === 0) {
        // Allow setting even if items not yet loaded (e.g., rehydration before fetch completes).
        state.activeTabId = action.payload;
      }
    },
    /** US-004: rehydrate activeTabId from persisted storage on app start. */
    rehydrateActiveTab(state, action: PayloadAction<string | null>) {
      if (action.payload) {
        state.activeTabId = action.payload;
      }
      state.rehydrated = true;
    },
    /** NFR-SEC-007: reset navigation state to safe defaults on auth failure / token expiry. */
    resetToSafeDefault(state) {
      const sorted = [...state.items].sort((a, b) => a.order - b.order);
      state.activeTabId = sorted.length > 0 ? sorted[0].id : null;
      state.error = null;
    },
  },
});

export const {
  fetchNavConfigStart,
  fetchNavConfigSuccess,
  fetchNavConfigFailure,
  setActiveTab,
  rehydrateActiveTab,
  resetToSafeDefault,
} = navigationSlice.actions;

export default navigationSlice.reducer;
