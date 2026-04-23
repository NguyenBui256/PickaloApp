/**
 * Babel configuration for React Native with TypeScript and SVG support.
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@navigation': './src/navigation',
            '@screens': './src/screens',
            '@components': './src/components',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@types': './src/types',
            '@utils': './src/utils',
            '@constants': './src/constants',
            '@theme': './src/theme',
          },
        },
      ],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env.development',
          safe: false,
          allowUndefined: true,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};


