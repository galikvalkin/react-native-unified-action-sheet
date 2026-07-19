const path = require('path');

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    'react-native-unified-action-sheet': {
      root: path.join(__dirname, '..'),
      platforms: {
        ios: {},
        android: {
          // android/build.gradle redirects the library's build dir into this
          // app's tree (see the subprojects block); the new-arch autolinking
          // CMake must follow it, or it points at the default
          // <lib>/android/build path that only exists when example/ has built.
          cmakeListsPath: path.join(
            __dirname,
            'android/build/react-native-unified-action-sheet/generated/source/codegen/jni/CMakeLists.txt'
          ),
        },
      },
    },
  },
};
