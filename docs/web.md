# Web

On [React Native Web](https://necolas.github.io/react-native-web/), the same calls show a sheet drawn in the page. There is nothing to install or wrap: no provider and no extra component. The options, the results and the button values are the same as on iOS and Android.

```ts
const { value } = await showActionSheetWithOptions({
  title: 'Share photo',
  options: [
    { label: 'Copy link', value: 'copy' },
    { label: 'Delete', style: 'destructive', value: 'delete' },
    { label: 'Cancel', style: 'cancel' },
  ],
});
```

## Setup

The library ships a web implementation in `.web.js` files, next to the native one. Bundlers set up for React Native Web already prefer `.web.js`; Expo does this out of the box. If you configure your bundler by hand, put the web extensions first, as React Native Web's own setup guide does:

```js
// vite.config.js (webpack's resolve.extensions takes the same list)
export default {
  resolve: {
    alias: { 'react-native': 'react-native-web' },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },
};
```

`example-web/` in this repository is a working Vite setup that runs the demo app in a browser.

## How it looks

The sheet uses the Android dialog's palette, sizes and spacing, in light or dark to match `userInterfaceStyle` or the system setting. It renders on top of the page, above anything else, including an open `Modal`, and blocks page scrolling while it is open.

| `presentationStyle` | Web |
| --- | --- |
| unset or `'centered'` | Centered dialog |
| `'anchored'` | Popup next to the anchor, below it or above when there is more room there; centered when the anchor can't be measured |
| `'bottom'` | Sheet attached to the bottom of the window |

- **Unset** means a centered dialog, as on Android. iOS uses its action sheet there.
- **Anchored popups** have no cancel row, as on Android and iPad: a click outside or Escape closes them.
- **Bottom sheets** do not drag. They fit their content, up to 90% of the window, and scroll beyond that. `detents` sets the opening height only: `'medium'` is half the window and `'large'` nearly all of it.

## Keyboard and accessibility

- The sheet is a modal `dialog`, labelled by its title (or message). The first enabled button gets focus when it opens, and focus returns to where it was when it closes.
- Tab and Shift+Tab move between the buttons and stay inside the sheet.
- Escape and a click on the backdrop cancel, the same as the cancel button. They resolve its index, or `-1` without one.
- In a prompt, Enter moves to the next field, then presses the preferred button.
- `accessibilityLabel` becomes the button's `aria-label`, and `accessibilityHint` its description.
- `testID` becomes `data-testid`, as React Native Web does for its own components, on buttons, the sheet and prompt fields.

## Prompts

`showPromptWithOptions()` shows the centered dialog with its field(s), with the same `type`, `placeholder`, `defaultValue` and `requiresText` support:

- `keyboardType` sets the input type: `'email-address'` an email field, `'phone-pad'` a phone field, `'url'` a URL field, and `'numeric'` a numeric keypad on touch devices.
- `'secure-text'` masks the field. `'login-password'` adds a password field, and both carry the autocomplete hints browsers use to offer saved credentials.

## Server rendering

Where there is no `document`, every sheet and prompt resolves as `'dismissed'` without showing anything, the same as on a platform the library does not support.
