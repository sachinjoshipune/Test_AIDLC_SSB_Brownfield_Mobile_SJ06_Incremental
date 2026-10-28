/**
 * SB360 Mobile Application entry point.
 *
 * Uses Expo's `registerRootComponent`, which is a thin wrapper around
 * `AppRegistry.registerComponent` for native (iOS/Android) and additionally
 * mounts the app into the DOM root for web (`expo start --web`, dev-preview
 * tooling only). Behavior for native builds is unchanged.
 */
import {registerRootComponent} from 'expo';
import App from './App';

registerRootComponent(App);
