import { describe, expect, it, jest } from '@jest/globals';

type GradleProperty =
  | { type: 'property'; key: string; value: string }
  | { type: 'comment'; value: string };
type PluginOptions = { material?: boolean; materialVersion?: string };
type ModConfig = { modResults: GradleProperty[] };
type Plugin = {
  (config: object, options?: PluginOptions): object;
  applyMaterialProperties: (
    properties: GradleProperty[],
    options?: PluginOptions
  ) => GradleProperty[];
};

// Not installed here: it is an optional peer that every Expo app provides.
// The mock applies the mod straight away, standing in for prebuild.
jest.mock(
  '@expo/config-plugins',
  () => ({
    withGradleProperties: (
      config: ModConfig,
      mod: (config: ModConfig) => ModConfig
    ) => mod(config),
  }),
  { virtual: true }
);

const plugin = require('../../app.plugin.js') as Plugin;
const { applyMaterialProperties } = plugin;

const existing: GradleProperty[] = [
  { type: 'comment', value: 'Project-wide Gradle settings.' },
  { type: 'property', key: 'newArchEnabled', value: 'true' },
];

describe('Expo config plugin', () => {
  it('opts into Material, leaving other properties alone', () => {
    expect(applyMaterialProperties(existing, { material: true })).toEqual([
      ...existing,
      { type: 'property', key: 'unifiedActionSheet.material', value: 'true' },
    ]);
  });

  it('writes the Material version only when one is given', () => {
    const result = applyMaterialProperties(existing, {
      material: true,
      materialVersion: '1.13.0',
    });

    expect(result).toContainEqual({
      type: 'property',
      key: 'unifiedActionSheet.materialVersion',
      value: '1.13.0',
    });
  });

  it('is idempotent across repeated prebuilds', () => {
    const options = { material: true, materialVersion: '1.13.0' };
    const once = applyMaterialProperties(existing, options);

    expect(applyMaterialProperties(once, options)).toEqual(once);
  });

  it('removes what an earlier run wrote once Material is turned off', () => {
    const enabled = applyMaterialProperties(existing, {
      material: true,
      materialVersion: '1.13.0',
    });

    expect(applyMaterialProperties(enabled, { material: false })).toEqual(
      existing
    );
    expect(applyMaterialProperties(enabled)).toEqual(existing);
  });

  it('applies the properties through withGradleProperties', () => {
    const config = { modResults: [...existing] };

    const result = plugin(config, { material: true }) as ModConfig;

    expect(result.modResults).toContainEqual({
      type: 'property',
      key: 'unifiedActionSheet.material',
      value: 'true',
    });
  });
});
