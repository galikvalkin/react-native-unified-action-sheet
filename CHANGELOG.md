# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0]

### Added

- `showPromptWithOptions(options)` — the same native dialog as the action sheet,
  with a text field. React Native's own `Alert.prompt` is iOS-only and silently
  does nothing on Android, so this is the one API here with no core equivalent.
  Resolves `{ buttonIndex, text }`, or `undefined` after `dismissActionSheet()`.
- Prompt button handlers receive the field's text. It is read when the prompt
  closes, including on a dismissal, so a draft is recoverable rather than lost.
- Prompt options: `placeholder`, `defaultValue`, `secureTextEntry` and
  `keyboardType` (`'default' | 'email-address' | 'numeric' | 'phone-pad' |
  'url'`). Buttons keep the sheet's `style`, `disabled` and `onPress`.
- `setNextPromptResult({ buttonIndex, text })` in the shipped Jest mock, the
  prompt counterpart to `setNextButtonIndex()`.
- Exported types: `PromptButtonInterface`, `PromptCommonOptionsInterface`,
  `PromptAndroidOptionsInterface`, `PromptOptionsInterface`,
  `PromptResultInterface`, plus the shared `BaseButtonInterface`,
  `BaseOptionsInterface` and `BaseAndroidOptionsInterface`.

### Changed

- The options and button fields the sheet and the prompt share are now declared
  once, in `BaseOptionsInterface` / `BaseButtonInterface`, which both APIs
  extend. No public type changed shape.

### Notes

- A prompt is always presented centered. UIKit has no text field in an action
  sheet, so `presentationStyle` and `anchor` do not apply to one.
- `dismissActionSheet()` and `dismissAllActionSheets()` close prompts too.

## [0.1.1]

No user-facing changes — the library is identical to 0.1.0. Republished from CI
so the release carries npm provenance; 0.1.0 was published by hand, because npm
only lets a trusted publisher be configured on a package that already exists.

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

[unreleased]: https://github.com/galikvalkin/react-native-unified-action-sheet/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/galikvalkin/react-native-unified-action-sheet/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/galikvalkin/react-native-unified-action-sheet/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/galikvalkin/react-native-unified-action-sheet/releases/tag/v0.1.0
