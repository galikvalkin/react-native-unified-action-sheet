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
| `showActionSheetWithOptions(options)` | the tapped button's index, or `undefined` after a dismiss from code |
| `showPromptWithOptions(options)` | `{ buttonIndex, text }`, or `undefined` after a dismiss from code |
| `dismissActionSheet()` | closes the most recently opened sheet or prompt |
| `dismissAllActionSheets()` | closes every open sheet and prompt |

What each gesture resolves with, and which `onPress` runs, is in [Behavior](behavior.md).

## Buttons

`options` is the list of buttons, in order.

| Field | Type | Description |
| --- | --- | --- |
| `label` | `string` | The button's text. |
| `style` | `'cancel' \| 'destructive'` | `'cancel'` renders a separated row and resolves on a backdrop tap or back. Only the first `'cancel'` counts. `'destructive'` uses the destructive color. |
| `disabled` | `boolean` | Renders the row dimmed and ignores taps. Independent of `style`. |
| `onPress` | `() => void` | Runs when this button resolves the sheet. A prompt's receives the field's text. |

## Sheet options

✅ supported · — ignored on that platform.

| Option | Type | iOS | Android | Description |
| --- | --- | :---: | :---: | --- |
| `title` | `string` | ✅ | ✅ | Sheet title. |
| `message` | `string` | ✅ | ✅ | Secondary text under the title. |
| `presentationStyle` | `'centered' \| 'anchored' \| 'bottom'` | ✅ | ✅ | How the sheet is presented; see the table below. |
| `anchor` | ref, or anything with `measureInWindow` | ✅ | ✅ | What an `'anchored'` sheet attaches to. Without a measurable anchor it falls back to a centered dialog. Ignored by `'bottom'`. |
| `userInterfaceStyle` | `'light' \| 'dark'` | ✅ | ✅ | Forces the appearance. Defaults to the system setting. |
| `tintColor` | `string` | ✅ | ✅ | Text color of non-destructive buttons. |
| `cancelButtonTintColor` | `string` | ✅ | ✅ | Text color of the cancel button; overrides `tintColor` for that row. |
| `destructiveColor` | `string` | ✅ | ✅ | Destructive row color, instead of Android's palette error color or iOS system red. |
| `buttonTextAlignment` | `'start' \| 'center'` | — | ✅ | Alignment of button labels. Defaults to `'start'`, which follows layout direction. |
| `anchorAlignment` | `'start' \| 'center'` | — | ✅ | Alignment of an `'anchored'` popup relative to its anchor. `'start'` (default) aligns leading edges, flipping in RTL. |

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

`showPromptWithOptions()` takes the sheet's `title`, `message`, colors, `userInterfaceStyle` and `buttonTextAlignment`, plus:

| Option | Type | Description |
| --- | --- | --- |
| `placeholder` | `string` | Placeholder text in the field. |
| `defaultValue` | `string` | Initial text in the field. |
| `secureTextEntry` | `boolean` | Masks the text, for passwords. |
| `keyboardType` | `'default' \| 'email-address' \| 'numeric' \| 'phone-pad' \| 'url'` | Keyboard to show. |

A prompt is always centered. UIKit has no text field in an action sheet, so `presentationStyle` and `anchor` do not apply.

## Types

Every options and button type is exported for typing your own wrappers: `ActionSheetOptionsInterface`, `PromptOptionsInterface`, `PromptResultInterface`, and the interfaces they are composed from.
