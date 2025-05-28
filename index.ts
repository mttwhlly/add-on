import 'expo-router/entry';
import 'react-native-url-polyfill/auto';

global.isReactNative = false;
if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
  global.isReactNative = true;
}