# react-native-unified-action-sheet

Unified action sheet API for React Native: a native `UIAlertController` on iOS, a native `AppCompatDialog` on Android.

| Android | Android (dark mode) | iOS |
| :---: | :---: | :---: |
| <img src="https://raw.githubusercontent.com/galikvalkin/react-native-unified-action-sheet/HEAD/docs/android-demo.gif" width="280" alt="Android demo" /> | <img src="https://raw.githubusercontent.com/galikvalkin/react-native-unified-action-sheet/HEAD/docs/android-demo-dark-mode.gif" width="280" alt="Android dark-mode demo — following the system dark theme" /> | <img src="https://raw.githubusercontent.com/galikvalkin/react-native-unified-action-sheet/HEAD/docs/ios-demo.gif" width="280" alt="iOS demo" /> |

<p align="center">
  <img src="https://raw.githubusercontent.com/galikvalkin/react-native-unified-action-sheet/HEAD/docs/ipad-demo.gif" width="420" alt="iPad demo — the sheet as a popover anchored to the button that opened it" />
  <br />
  <em>iPad: the same sheet presented as a popover, anchored to the view that opened it.</em>
</p>

- **Fully native, always on top.** The sheet gets its own platform window, so it renders above your whole view tree, including an open [`Modal`](https://reactnative.dev/docs/modal). JS-rendered sheets live inside the component tree, where `overflow`, `zIndex` or a modal can clip or bury them.
- **One API on both platforms**: action sheets, anchored popovers, bottom sheets and text prompts.
- **Prompts on Android too.** React Native's `Alert.prompt` is iOS-only; `showPromptWithOptions()` works on both.
- **No dependencies.** `react` and `react-native` are peers; the Android bottom sheet's Material is opt-in.

## Installation

```sh
npm install react-native-unified-action-sheet
# or
yarn add react-native-unified-action-sheet
```

Autolinking handles the rest. In Expo, use a development build (`npx expo run:ios` / `npx expo run:android`); custom native modules do not work in Expo Go.

**Optional:** for the Android bottom sheet, set `unifiedActionSheet.material=true` in `android/gradle.properties`, or add the Expo plugin. See [Bottom sheets](docs/bottom-sheet.md).

## Usage

```ts
import { showActionSheetWithOptions } from 'react-native-unified-action-sheet';

await showActionSheetWithOptions({
  title: 'Delete item?',
  message: 'This action cannot be undone.',
  options: [
    { label: 'Delete', style: 'destructive', onPress: deleteItem },
    { label: 'Archive', onPress: archiveItem },
    { label: 'Unavailable', disabled: true },
    { label: 'Cancel', style: 'cancel' },
  ],
});
```

The call resolves with the tapped button's index, and that button's `onPress` runs. A backdrop tap or back resolves the `'cancel'` button. The promise never rejects. See [Behavior](docs/behavior.md).

### Presentation styles

| `presentationStyle` | iOS | Android |
| --- | --- | --- |
| unset | Action sheet from the bottom | Centered dialog |
| `'centered'` | Centered alert | Centered dialog |
| `'anchored'` | Popover on iPad, pointing at `anchor` | Popup attached to `anchor` |
| `'bottom'` | Sheet with a grabber (popover on iPad) | Material bottom sheet ([opt-in](docs/bottom-sheet.md)) |

### Prompts

```ts
import { showPromptWithOptions } from 'react-native-unified-action-sheet';

const result = await showPromptWithOptions({
  title: 'Rename item',
  placeholder: 'New name',
  defaultValue: 'Untitled',
  options: [
    { label: 'Save', onPress: (text) => rename(text) },
    { label: 'Cancel', style: 'cancel' },
  ],
});
// { buttonIndex, text }, or undefined after dismissActionSheet().
```

### Dismissing from code

`dismissActionSheet()` closes the most recently opened sheet, and `dismissAllActionSheets()` closes every open one. Dismissed sheets resolve with `undefined`.

## Documentation

- [API reference](docs/api.md): every option, per platform
- [Behavior](docs/behavior.md): what each gesture resolves with, and platform differences
- [Bottom sheets](docs/bottom-sheet.md): both platforms, and enabling Material on Android
- [Testing](docs/testing.md): the shipped Jest mock

## Compatibility

| React Native | Old architecture | New architecture |
| --- | --- | --- |
| 0.81.x | ✅ Android verified | ✅ Android verified |
| 0.85.x (latest line) | n/a (removed in RN 0.82+) | ✅ verified (iOS + Android) |

**iOS on RN 0.81 is unverified.** The pod integrates, but React Native 0.81 itself does not build under Xcode 26 — a toolchain clash unrelated to this library.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
