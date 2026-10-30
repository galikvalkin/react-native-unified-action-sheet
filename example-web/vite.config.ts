import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const extensions = [
  '.web.tsx',
  '.web.ts',
  '.web.js',
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.json',
];

/// React Native Web, the way an app sets it up: react-native resolves to
/// react-native-web, and .web.* files win, which is how the library's DOM
/// backend replaces the native one. The library itself comes from ../src, so
/// edits show up without a build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native-unified-action-sheet': here('../src/index.tsx'),
    },
    extensions,
    // ../example-shared and ../src sit outside this folder; one copy of each.
    dedupe: [
      'react',
      'react-dom',
      'react-native-web',
      'react-native-safe-area-context',
    ],
  },
  // The dev server's dependency prebundling does not read resolve.extensions,
  // and would otherwise take a package's native files over its .web.js ones.
  optimizeDeps: { rolldownOptions: { resolve: { extensions } } },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  server: { fs: { allow: [here('..')] } },
});
