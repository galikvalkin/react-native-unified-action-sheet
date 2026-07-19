# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0]

Initial release.

### Added

- `showActionSheetWithOptions(options)` — presents a native `UIAlertController`
  on iOS and a native `AppCompatDialog` on Android through one TurboModule, and
  resolves with the tapped button's index.
- Object-shaped buttons: `{ label, style?: 'cancel' | 'destructive', disabled?, onPress? }`.
  `onPress` runs when that button resolves the sheet, so callers rarely match on
  an index.
- `dismissActionSheet()` and `dismissAllActionSheets()` for closing sheets from
  code; both resolve the affected promises with `undefined`.
- `presentationStyle: 'centered' | 'anchored'`. An `'anchored'` sheet attaches to
  the `anchor` ref, which the library measures in JS — an iPad popover on iOS, a
  menu-style popup on Android.
- Theming options: `userInterfaceStyle`, `tintColor`, `cancelButtonTintColor`,
  `destructiveColor`, and the Android-only `buttonTextAlignment` and
  `anchorAlignment`.
- A Jest mock at the `react-native-unified-action-sheet/jest` subpath, driven by
  `setNextButtonIndex()` so the pressed button's `onPress` still runs.
- CommonJS and ES module builds, plus type definitions for both.

### Notes

- Supports React Native 0.81 on both architectures through the latest release.
- No `com.google.android.material` dependency, and no runtime dependencies —
  `react` and `react-native` are peers.

[unreleased]: https://github.com/galikvalkin/react-native-unified-action-sheet/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/galikvalkin/react-native-unified-action-sheet/releases/tag/v0.1.0
