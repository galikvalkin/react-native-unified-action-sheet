# Behavior

## How a sheet resolves

`showActionSheetWithOptions()` resolves with the tapped button's index, and that button's `onPress` runs too. The two never disagree:

| | Promise resolves with | `onPress` runs |
| --- | --- | --- |
| Tapping a button | its index | that button's |
| Backdrop tap, back button, swipe down | the `'cancel'` button's index, or `-1` if there is none | the cancel button's, if there is one |
| `dismissActionSheet()` | `undefined` | nothing |

The promise never rejects on its own, only if one of your own `onPress` handlers throws.

A prompt resolves the same way, with `{ buttonIndex, text }`, and its `onPress` receives the text. The text is whatever was in the field when the prompt closed, including on a dismissal, so a draft is recoverable.

## Dismissing from code

`dismissActionSheet()` closes the most recently opened sheet, and `dismissAllActionSheets()` closes every open one. Both close prompts too. Both are no-ops when nothing is open, and the dismissed sheets resolve with `undefined`.

## Platform differences

- **Which gestures dismiss differs.** On iOS an action sheet can only be tapped away if it has a `'cancel'` button, and a `'centered'` one never can, because UIKit treats it as strictly modal. Android's centered dialog always cancels on a backdrop tap. Give a sheet a cancel button if you want that gesture everywhere. A `'bottom'` sheet can be swiped away on both platforms, with or without one.
- **On iPad, a popover hides the cancel row**, since tapping outside already cancels. The index you receive is unaffected.
- **Sheets stack.** Opening one over another puts it on top, and each resolves its own promise. Opening a sheet over a `Modal` does not dismiss the modal.
- **Light or dark follows the system setting** unless `userInterfaceStyle` forces one, chosen when the sheet opens. It uses its own palette, so it looks the same in any host app.
