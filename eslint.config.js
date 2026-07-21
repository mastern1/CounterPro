// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // dashboard/ is a separate Vite+TS app with its own linter (oxlint); the
    // Expo config can't resolve its "@" path alias and has no business there.
    ignores: ['dist/*', 'dashboard/**'],
  },
]);
