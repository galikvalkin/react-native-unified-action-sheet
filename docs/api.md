# API reference

```ts
import {
  showActionSheetWithOptions,
  showPromptWithOptions,
  dismissActionSheet,
  dismissAllActionSheets,
} from 'react-native-unified-action-sheet';
```

| Function | Resolves with |
| --- | --- |
| `showActionSheetWithOptions(options)` | `{ reason, buttonIndex }` |
| `showPromptWithOptions(options)` | `{ reason, buttonIndex, text, password? }` |
| `dismissActionSheet()` | closes the most recently opened sheet or prompt |
| `dismissAllActionSheets()` | closes every open sheet and prompt |

`reason` is `'selected'` (a button other than cancel), `'cancelled'` (the cancel button, a backdrop tap, back or a swipe down) or `'dismissed'` (`dismissActionSheet()`, `dismissAllActionSheets()` or a JS reload). `buttonIndex` is the button that closed it: the cancel button's index or `-1` for a cancellation, `undefined` for a dismissal. What each gesture resolves with, and which `onPress` runs, is in [Behavior](behavior.md).

## Buttons

`options` is the list of buttons, in order.

| Field | Type | Description |
| --- | --- | --- |
| `label` | `string` | The button's text. |
| `style` | `'cancel' \| 'destructive'` | `'cancel'` renders a separated row and resolves on a backdrop tap or back. Only the first `'cancel'` counts. `'destructive'` uses the destructive color. |
| `disabled` | `boolean` | Renders the row dimmed and ignores taps. Independent of `style`. |
| `preferred` | `boolean` | The default action, emphasized. Only the first preferred button counts. On Android and in the iOS bottom sheet the row is bold. In iOS centered alerts and prompts it gets UIKit's own preferred-action style, a filled button from iOS 26 and bold text before, and in a prompt the return key presses it. UIKit ignores it in the standard action sheet. |
| `onPress` | `() => void` | Runs when this button resolves the sheet. A prompt's receives `{ text, password? }`. |
| `requiresText` | `boolean` | Prompts only: keeps the button disabled while a field is empty. |
| `testID` | `string` | Finds the button in end-to-end tests; not shown or spoken. Every style on both platforms. See [Testing](testing.md#end-to-end-tests). |
| `accessibilityLabel` | `string` | What screen readers say instead of the label. The iOS bottom sheet and every Android style; iOS alerts, action sheets and prompts ignore it, since `UIAlertAction` has no public API for it. |
| `accessibilityHint` | `string` | Extra spoken guidance after the label, e.g. what the button does. Same coverage as `accessibilityLabel`. |

## Sheet options

✅ supported · — ignored on that platform.

| Option | Type | iOS | Android | Description |
| --- | --- | :---: | :---: | --- |
| `title` | `string` | ✅ | ✅ | Sheet title. |
| `message` | `string` | ✅ | ✅ | Secondary text under the title. |
| `presentationStyle` | `'centered' \| 'anchored' \| 'bottom'` | ✅ | ✅ | How the sheet is presented; see the table below. |
| `anchor` | ref, or anything with `measureInWindow` | ✅ | ✅ | What an `'anchored'` sheet attaches to. Without a measurable anchor (or one that does not answer within 500 ms, e.g. because it unmounted) it falls back to a centered dialog. Ignored by `'bottom'`. |
| `userInterfaceStyle` | `'light' \| 'dark'` | ✅ | ✅ | Forces the appearance. Defaults to the system setting. |
| `tintColor` | `string` | ✅ | ✅ | Text color of non-destructive buttons. Any color React Native accepts: `'#RGB'`, `'#RRGGBB'`, `'#RRGGBBAA'`, `'rgb()'`/`'rgba()'`, `'hsl()'` or a named color. An unparseable value is ignored. Same for the two below. |
| `cancelButtonTintColor` | `string` | ✅ | ✅ | Text color of the cancel button; overrides `tintColor` for that row. |
| `destructiveColor` | `string` | ✅ | ✅ | Destructive row color, instead of Android's palette error color or iOS system red. |
| `buttonTextAlignment` | `'start' \| 'center'` | — | ✅ | Alignment of button labels. Defaults to `'start'`, which follows layout direction. |
| `anchorAlignment` | `'start' \| 'center'` | — | ✅ | Alignment of an `'anchored'` popup relative to its anchor. `'start'` (default) aligns leading edges, flipping in RTL. |
| `detents` | `('auto' \| 'medium' \| 'large')[]` | ✅ | ✅ | `'bottom'` only: the heights the sheet can rest at, opening at the first. See [Bottom sheets](bottom-sheet.md#heights). |
| `onShow` | `() => void` | ✅ | ✅ | Called once the sheet is on screen, at most once and before the promise resolves. See [Behavior](behavior.md#when-onshow-fires). |
| `testID` | `string` | ✅ | ✅ | Finds the sheet itself in end-to-end tests, e.g. to wait for it to appear. See [Testing](testing.md#end-to-end-tests). |

### `presentationStyle`

| Value | iOS | Android |
| --- | --- | --- |
| unset | The standard action sheet, from the bottom (a popover on iPad) | Centered dialog |
| `'centered'` | Centered alert | Centered dialog |
| `'anchored'` | A popover on iPad, pointing at `anchor`; the standard action sheet on iPhone | Menu-style popup attached to `anchor` |
| `'bottom'` | A [bottom sheet](bottom-sheet.md) with a grabber on iPhone; the action sheet's popover on iPad | Material [bottom sheet](bottom-sheet.md); needs an opt-in |

**The defaults differ**: iOS presents from the bottom, Android centered. Pass a style to get the same one on both.

An `'anchored'` sheet takes the ref itself; the library measures it in JS and sends only the rectangle across:

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

## Prompt options

`showPromptWithOptions()` takes the sheet's `title`, `message`, colors, `userInterfaceStyle`, `buttonTextAlignment` and `onShow`, plus:

| Option | Type | Description |
| --- | --- | --- |
| `type` | `'plain-text' \| 'secure-text' \| 'login-password'` | As in React Native's `Alert.prompt`. `'secure-text'` masks the text; `'login-password'` adds a masked password field below, and resolves `password`. Defaults to `'plain-text'`. |
| `placeholder` | `string` | Placeholder text in the (first) field. |
| `passwordPlaceholder` | `string` | Placeholder of the password field of a `'login-password'` prompt. |
| `defaultValue` | `string` | Initial text in the (first) field. |
| `keyboardType` | `'default' \| 'email-address' \| 'numeric' \| 'phone-pad' \| 'url'` | Keyboard for the (first) field. |
| `secureTextEntry` | `boolean` | Same as `type: 'secure-text'`. Kept for compatibility; `type` wins when both are set. |
| `fieldTestID` | `string` | Finds the (first) text field in end-to-end tests, e.g. to type into it. |
| `passwordFieldTestID` | `string` | Finds the password field of a `'login-password'` prompt in end-to-end tests. |

A `'login-password'` prompt marks its fields as username and password, so iOS AutoFill and Android autofill services can offer saved credentials.

A prompt is always centered. UIKit has no text field in an action sheet, so `presentationStyle` and `anchor` do not apply.

## Types

Every options, button and result type is exported for typing your own wrappers: `ActionSheetOptionsInterface`, `ActionSheetResultInterface`, `ActionSheetDetent`, `PromptOptionsInterface`, `PromptResultInterface`, `PromptValuesInterface`, `CloseReason`, and the interfaces they are composed from. The result types are discriminated unions on `reason`, so checking `reason !== 'dismissed'` narrows `buttonIndex` to a number.
