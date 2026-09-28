# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed (breaking)

- **Results carry a reason.** `showActionSheetWithOptions()` resolves
  `{ reason, buttonIndex }` instead of a bare index, and
  `showPromptWithOptions()` resolves `{ reason, buttonIndex, text, password? }`
  instead of `{ buttonIndex, text }` or `undefined`. `reason` is `'selected'`,
  `'cancelled'` (the cancel button, a backdrop tap, back or a swipe down) or
  `'dismissed'` (closed from code or by a JS reload). A dismissal used to
  resolve `undefined`; it now resolves `{ reason: 'dismissed', buttonIndex:
  undefined }`, and a dismissed prompt keeps the text that was in its field.
  The result types are discriminated unions on `reason`.

  ```ts
  // before
  const index = await showActionSheetWithOptions(options);
  if (index === undefined) { /* dismissed */ }

  // after
  const { reason, buttonIndex } = await showActionSheetWithOptions(options);
  if (reason === 'dismissed') { /* dismissed */ }
  ```
- **Prompt `onPress` receives an object.** It is called with
  `{ text, password? }` instead of the text string:
  `onPress: ({ text }) => rename(text)`.
- The Jest mock resolves the same shapes, deriving `reason` as the real module
  does; `setNextPromptResult` accepts an optional `password`.

### Added

- `preferred` on a button: the default action, shown bold. On iOS it is the
  alert's `preferredAction` (so the return key presses it in a prompt) and a
  semibold row in the bottom sheet; UIKit ignores it in the standard action
  sheet. On Android the row is bold, and in a prompt the keyboard's done key
  presses it.
- `detents` for `presentationStyle: 'bottom'`: `'auto'`, `'medium'` and
  `'large'`. The sheet opens at the first and can be dragged to the others.
- Prompt `type`: `'plain-text'`, `'secure-text'` or `'login-password'`, as in
  React Native's `Alert.prompt`. `'login-password'` adds a masked password
  field (`passwordPlaceholder`), resolves `password`, and marks both fields
  for iOS AutoFill and Android autofill. `secureTextEntry` still works, as
  `type: 'secure-text'`.
- `requiresText` on a prompt button keeps it disabled while a field is empty.
- New exported types: `ActionSheetResultInterface`, `ActionSheetDetent`,
  `CloseReason`, `CloseResultInterface` and `PromptValuesInterface`.

### Fixed

- iOS: alerts and prompts were never freed after closing. Each action's handler
  held its presentation, which held the alert, which held the action.

## [0.3.0]

### Added

- `presentationStyle: 'bottom'`: a native bottom sheet on both platforms, with
  a drag handle and swipe to dismiss. A long list opens part-way and drags up
  to expand. On iOS it is a `UISheetPresentationController` sheet with native
  rows (on iPad, the action sheet's popover instead); on Android, a Material 3
  bottom sheet. `anchor` is ignored for it.
- Material is opt-in, so apps that don't use the bottom sheet stay free of the
  dependency. Set `unifiedActionSheet.material=true` in
  `android/gradle.properties`. Only then does the library add
  `com.google.android.material` (1.12.0 by default; override it with
  `ext.materialVersion` or `unifiedActionSheet.materialVersion`).
- An Expo config plugin that writes those properties:
  `plugins: [['react-native-unified-action-sheet', { material: true }]]`, with
  an optional `materialVersion`. `@expo/config-plugins` is an optional peer
  dependency.

### Fixed

- On iOS, a sheet, alert or prompt stayed on screen after a JS reload (pressing
  `r` in Metro). It now closes on reload, as it already did on Android, and its
  promise is left unresolved, since it belonged to the discarded runtime.

### Notes

- Without the Material opt-in, `'bottom'` on Android falls back to the centered
  dialog, and warns once in development.
- Prompts do not support `'bottom'`; they stay centered on both platforms.

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

[unreleased]: https://github.com/galikvalkin/react-native-unified-action-sheet/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/galikvalkin/react-native-unified-action-sheet/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/galikvalkin/react-native-unified-action-sheet/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/galikvalkin/react-native-unified-action-sheet/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/galikvalkin/react-native-unified-action-sheet/releases/tag/v0.1.0
