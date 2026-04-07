/**
 * Jest test setup file.
 * Runs before each test suite.
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    MAP_TYPES: {
      STANDARD: 0,
      SATELLITE: 1,
      HYBRID: 2,
    },
    ProviderPropType: {},
    Marker: ({children}: {children: React.ReactNode}) => (
      <View testID="map-marker">{children}</View>
    ),
    Polyline: () => <View testID="map-polyline" />,
    Polygon: () => <View testID="map-polygon" />,
    Circle: () => <View testID="map-circle" />,
    UrlTile: () => <View testID="map-urltile" />,
    WebView: () => <View testID="map-webview" />,
    Callout: ({children}: {children: React.ReactNode}) => (
      <View testID="map-callout">{children}</View>
    ),
  };
});

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    WebView: ({testID}: {testID?: string}) => (
      <View testID={testID || 'webview'} />
    ),
  };
});

// Mock react-native-geolocation-service
jest.mock('react-native-geolocation-service', () => ({
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    default: ({name}: {name: string}) => <View testID={`icon-${name}`} />,
  };
});

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};
