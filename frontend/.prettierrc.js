/**
 * Prettier configuration for consistent code formatting.
 */

module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  printWidth: 100,
  quoteProps: 'as-needed',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: false,
  overrides: [
    {
      files: '*.json',
      options: {
        singleQuote: false,
      },
    },
  ],
};
