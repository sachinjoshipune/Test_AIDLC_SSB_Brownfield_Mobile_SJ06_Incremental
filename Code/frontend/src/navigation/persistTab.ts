import {getLocalItem, setLocalItem} from '../storage/localStorage';
import type {AppDispatch} from '../store/store';
import {rehydrateActiveTab} from '../store/navigationSlice';

/**
 * US-004: Persists the active tab id to local storage on every change and
 * rehydrates it on app start, so the visitor resumes on the previously
 * active section after an app restart.
 */

const ACTIVE_TAB_KEY = 'activeTabId';

export async function persistActiveTab(tabId: string): Promise<void> {
  await setLocalItem(ACTIVE_TAB_KEY, tabId);
}

/**
 * Call once during app bootstrap, before/alongside the initial nav config
 * fetch, to restore the last active tab (if any) into Redux.
 */
export async function rehydrateActiveTabFromStorage(dispatch: AppDispatch): Promise<void> {
  const savedTabId = await getLocalItem<string>(ACTIVE_TAB_KEY);
  dispatch(rehydrateActiveTab(savedTabId));
}

export default {persistActiveTab, rehydrateActiveTabFromStorage};
