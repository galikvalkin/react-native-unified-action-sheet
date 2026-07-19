const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * The library root is watched so the app consumes live library sources
 * (via the `react-native-unified-action-sheet-source` export condition),
 * while the blockList keeps the root node_modules' different react-native
 * copy out of this app's bundle.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
module.exports = withMetroConfig(mergeConfig(getDefaultConfig(__dirname), {}), {
  root,
  dirname: __dirname,
  conditions: ['react-native-unified-action-sheet-source'],
});
