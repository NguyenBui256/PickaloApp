/**
 * Metro configuration for React Native with SVG transformer support.
 */

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ttf', 'otf'],
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'svg'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
