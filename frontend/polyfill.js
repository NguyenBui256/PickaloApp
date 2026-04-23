import { BackHandler } from 'react-native';

// Polyfill for deprecated BackHandler.removeEventListener
// Prevents crashes in libraries like react-native-modal running on newer RN versions
if (BackHandler && !BackHandler.removeEventListener) {
  BackHandler.removeEventListener = function () {};
}
