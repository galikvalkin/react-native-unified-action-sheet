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

- **Fully native, always on top.** The sheet gets its own platform window, so it renders above your entire React Native view tree — including above an already-open [`Modal`](https://reactnative.dev/docs/modal). JS-rendered action sheets live *inside* the component tree, where `overflow`, `zIndex`, a transform or an open modal can clip or bury them.
- **One API, native on both platforms**, so the same options behave the same way.
- Works on React Native **0.81 (old and new architecture)** through the **latest** release.
- **No extra native dependencies** on either platform, and zero runtime dependencies (`react` / `react-native` peers only).

## Installation

```sh
npm install react-native-unified-action-sheet
# or
yarn add react-native-unified-action-sheet
```

Autolinking handles the rest on both platforms. In Expo apps, use a development build (`npx expo run:ios` / `npx expo run:android`) — custom native modules do not work in **Expo Go**.

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

Each button is an object. `style` marks the two native roles, which are mutually exclusive; `disabled` is independent of it; and `onPress` runs when that button resolves the sheet, so reordering buttons cannot send one down another's branch. The call also resolves with the tapped index, and the two never disagree:

| | promise resolves with | `onPress` runs |
| --- | --- | --- |
| Tapping a button | its index | that button's |
| Backdrop tap, back button, swipe down | the `'cancel'` button's index, or `-1` if there is none | the cancel button's, if there is one |
| `dismissActionSheet()` | `undefined` | nothing |

The promise never rejects on its own — only if one of your own `onPress` handlers throws.

### Anchored sheets

`presentationStyle: 'anchored'` attaches the sheet to a view. Pass the ref itself; the library measures it and sends only the resulting rectangle across:

```tsx
const anchorRef = useRef<View>(null);

<Pressable
  ref={anchorRef}
  onPress={() =>
    showActionSheetWithOptions({
      options: [...],
      presentationStyle: 'anchored',
      anchor: anchorRef,
    })
  }
/>;
```

Anything with a `measureInWindow` method works, which is every React Native host component ref. On iOS the anchor only applies on iPad, where the sheet becomes a popover; iPhone always presents from the bottom.

### Dismissing from code

`dismissActionSheet()` closes the most recently opened sheet, `dismissAllActionSheets()` closes every open one. Both are no-ops when nothing is open, and the dismissed sheets resolve with `undefined`.

```ts
import {
  dismissActionSheet,
  dismissAllActionSheets,
} from 'react-native-unified-action-sheet';
```

### Options

| Option | Type | iOS | Android | Description |
| --- | --- | :---: | :---: | --- |
| `options` | `ActionSheetButtonInterface[]` | ✅ | ✅ | The buttons, in order: `{ label, style?, disabled?, onPress? }`. |
| `style` (per button) | `'cancel' \| 'destructive'?` | ✅ | ✅ | `'cancel'` renders a separated cancel row on Android and resolves on backdrop tap / back; `'destructive'` renders in the destructive color. Only the first `'cancel'` counts. |
| `disabled` (per button) | `boolean?` | ✅ | ✅ | Renders the row dimmed and unresponsive to taps. |
| `onPress` (per button) | `() => void?` | ✅ | ✅ | Runs when this button resolves the sheet. |
| `title` | `string?` | ✅ | ✅ | Sheet title. |
| `message` | `string?` | ✅ | ✅ | Secondary text under the title. |
| `presentationStyle` | `'centered' \| 'anchored'` | ✅ | ✅ | `'centered'` is a centered dialog; `'anchored'` attaches to `anchor` (an iPad popover on iOS). **Defaults differ**: Android defaults to `'centered'`, iOS to the standard action sheet. |
| `anchor` | `ActionSheetAnchorInterface?` | ✅ | ✅ | The view to attach to — a ref, or anything with `measureInWindow`. Without a measurable anchor an `'anchored'` sheet falls back to a centered dialog. |
| `anchorAlignment` | `'start' \| 'center'` | — | ✅ | Alignment of an `'anchored'` popup relative to its anchor. `'start'` (default) aligns leading edges, flipping in RTL. |
| `userInterfaceStyle` | `'light' \| 'dark'` | ✅ | ✅ | Forces the appearance; defaults to following the system setting. |
| `tintColor` | `string?` | ✅ | ✅ | Text color of non-destructive buttons. |
| `cancelButtonTintColor` | `string?` | ✅ | ✅ | Text color of the cancel button; overrides `tintColor` for that row. |
| `destructiveColor` | `string?` | ✅ | ✅ | Overrides the destructive row color (Android's palette error color, iOS system red). |
| `buttonTextAlignment` | `'start' \| 'center'` | — | ✅ | Alignment of button labels. Defaults to `'start'`, which follows layout direction. |

The options types are exported for typing your own wrappers:

```ts
import type {
  ActionSheetOptionsInterface, // what showActionSheetWithOptions accepts
  ActionSheetCommonOptionsInterface,
  ActionSheetAndroidOptionsInterface,
  ActionSheetButtonInterface, // a single button
  ActionSheetAnchorInterface, // anything with measureInWindow
} from 'react-native-unified-action-sheet';
```

### Platform notes

- **Which gestures dismiss differs.** On iOS a sheet can only be tapped away if it has a `'cancel'` button, and a `'centered'` one never can — UIKit treats it as strictly modal. Android's centered dialog always cancels on a backdrop tap. Give a sheet a cancel button if you want that gesture everywhere.
- **On iPad, a popover hides the cancel row**, since tapping outside already cancels. The index you receive is unaffected.
- **Sheets stack.** Opening one over another puts it on top, and each resolves its own promise. Opening a sheet over a `Modal` does not dismiss the modal.
- **Light or dark follows the system setting** unless `userInterfaceStyle` forces one, chosen when the sheet opens. The sheet uses its own palette, so it looks the same in any host app.
- **Long lists scroll**, with the title and message pinned above them.
- On Android, a sheet with no available activity resolves the cancel index rather than hanging, so a cancel handler can run for a sheet that never appeared.

## Testing

The package ships a Jest mock, so a screen that opens a sheet can be tested without the native module:

```ts
jest.mock('react-native-unified-action-sheet', () =>
  require('react-native-unified-action-sheet/jest')
);
```

Every sheet then resolves with no selection. To simulate a tap, queue the index the next sheet should resolve with — the pressed button's `onPress` runs, just as it would for real:

```ts
import { setNextButtonIndex } from 'react-native-unified-action-sheet/jest';

setNextButtonIndex(0);
await openTheSheet();
```

Prefer that over `mockResolvedValueOnce`, which replaces the implementation and so skips `onPress`. `dismissActionSheet` and `dismissAllActionSheets` are plain spies.

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
