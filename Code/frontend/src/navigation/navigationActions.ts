import type {NavigationContainerRef} from '@react-navigation/native';
import type {AppDispatch, RootState} from '../store/store';
import {setActiveTab} from '../store/navigationSlice';
import {emitAuditEvent} from '../audit/auditEmitter';
import {persistActiveTab} from './persistTab';

/**
 * US-002/US-009: Centralized navigation dispatch + route-validation guard.
 * All tab-tap / route-change flows in the app MUST go through `navigateToTab`
 * so the "only one active tab" invariant (US-003) and the "no invalid
 * transitions" guard (US-009) are enforced in exactly one place.
 */

/**
 * Mirrors the `Tab.Screen` names registered in RootNavigator.tsx. Declared as
 * a concrete param-list (rather than `Record<string, undefined>`) so that
 * `createBottomTabNavigator<RootStackParamList>()`'s inferred ref type
 * exactly matches `NavigationContainerRef<RootStackParamList>` used below
 * (a generic index-signature type is not assignable to/from the concrete
 * param-list type React Navigation infers from actual screen names).
 */
export type RootStackParamList = {
  ExploreScreen: undefined;
  MapScreen: undefined;
  PlanScreen: undefined;
  ProfileScreen: undefined;
};

// Documented React Navigation TypeScript pattern: augmenting the global
// `ReactNavigation.RootParamList` lets `<NavigationContainer>`'s inferred ref
// type (and `useNavigation()`/`Link` elsewhere) default to RootStackParamList
// without needing an explicit generic at every call site.
// https://reactnavigation.org/docs/typescript/#specifying-default-types-for-usenavigation-link-ref-etc
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

export function setNavigationRef(ref: NavigationContainerRef<RootStackParamList> | null): void {
  navigationRef = ref;
}

export interface NavigateResult {
  success: boolean;
  reason?: 'UNKNOWN_ROUTE';
}

/**
 * Validates `targetTabId` against the current navigation config (US-009)
 * before calling React Navigation's `navigate()` and updating Redux's
 * activeTabId (US-002, US-003). Rejects silently (no crash, no navigation)
 * and emits an audit event when the target is invalid (FR-023).
 */
export function navigateToTab(
  dispatch: AppDispatch,
  getState: () => RootState,
  targetTabId: string,
): NavigateResult {
  const state = getState();
  const targetItem = state.navigation.items.find(item => item.id === targetTabId);

  if (!targetItem) {
    emitAuditEvent('nav.transition.rejected', {
      reason: 'unknown_route',
      targetTabId,
    });
    return {success: false, reason: 'UNKNOWN_ROUTE'};
  }

  const previousTabId = state.navigation.activeTabId;
  if (previousTabId && previousTabId !== targetTabId) {
    emitAuditEvent('nav.tab.deselected', {tabId: previousTabId});
  }

  dispatch(setActiveTab(targetTabId));
  emitAuditEvent('nav.tab.selected', {tabId: targetTabId});
  // US-004: persist on every successful tab change so it can be restored on restart.
  void persistActiveTab(targetTabId);

  if (navigationRef?.isReady()) {
    navigationRef.navigate(targetItem.route as never);
  }

  return {success: true};
}

/**
 * Always-allowed "Return to Home" action (US-008): navigates to the Explore
 * tab regardless of current state, used by ErrorState.tsx.
 */
export function navigateToHome(dispatch: AppDispatch, getState: () => RootState): void {
  const state = getState();
  const sorted = [...state.navigation.items].sort((a, b) => a.order - b.order);
  const homeItem = sorted.find(item => item.id === 'explore') ?? sorted[0];

  if (!homeItem) {
    // No nav config loaded at all; nothing safe to navigate to yet.
    return;
  }

  dispatch(setActiveTab(homeItem.id));
  emitAuditEvent('nav.screen.recover', {route: homeItem.route});

  if (navigationRef?.isReady()) {
    navigationRef.navigate(homeItem.route as never);
  }
}

export default {setNavigationRef, navigateToTab, navigateToHome};
