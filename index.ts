import 'react-native-url-polyfill/auto';
import 'expo-router/entry';

global.isReactNative = false;
if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
  global.isReactNative = true;
}