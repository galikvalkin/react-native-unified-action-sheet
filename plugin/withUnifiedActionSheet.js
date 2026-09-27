/**
 * Expo config plugin. Writes the gradle properties that opt the Android build
 * into Material, which presentationStyle 'bottom' needs:
 *
 *   plugins: [['react-native-unified-action-sheet', { material: true }]]
 *
 * Options:
 *   material         enable the Material bottom sheet (default false)
 *   materialVersion  override the Material version the library pins
 */
const MATERIAL_KEY = 'unifiedActionSheet.material';
const MATERIAL_VERSION_KEY = 'unifiedActionSheet.materialVersion';

/// Pure, so it can be tested without Expo. Drops any previous value of both
/// keys before adding the current ones: prebuild runs repeatedly, and turning
/// the option off must remove what an earlier run wrote.
const applyMaterialProperties = (properties, options = {}) => {
  const next = properties.filter(
    (item) =>
      !(
        item.type === 'property' &&
        (item.key === MATERIAL_KEY || item.key === MATERIAL_VERSION_KEY)
      )
  );

  if (options.material) {
    next.push({ type: 'property', key: MATERIAL_KEY, value: 'true' });

    if (options.materialVersion) {
      next.push({
        type: 'property',
        key: MATERIAL_VERSION_KEY,
        value: String(options.materialVersion),
      });
    }
  }

  return next;
};

const withUnifiedActionSheet = (config, options = {}) => {
  // Required here rather than at the top: @expo/config-plugins is an optional
  // peer, present in every Expo project and absent from bare ones, which never
  // load this file.
  const { withGradleProperties } = require('@expo/config-plugins');

  return withGradleProperties(config, (modConfig) => {
    modConfig.modResults = applyMaterialProperties(
      modConfig.modResults,
      options
    );

    return modConfig;
  });
};

module.exports = withUnifiedActionSheet;
module.exports.applyMaterialProperties = applyMaterialProperties;
