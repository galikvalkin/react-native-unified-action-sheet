# Testing

The package ships a Jest mock, so a screen that opens a sheet can be tested without the native module:

```ts
jest.mock('react-native-unified-action-sheet', () =>
  require('react-native-unified-action-sheet/jest')
);
```

Every sheet then resolves `{ reason: 'dismissed', buttonIndex: undefined }`. To simulate a tap, queue the index it should resolve with. The mock derives `reason` as the real module does (`'cancelled'` for the cancel button or `-1`, otherwise `'selected'`), and the pressed button's `onPress` runs as it would for real:

```ts
import { setNextButtonIndex } from 'react-native-unified-action-sheet/jest';

setNextButtonIndex(0);
await openTheSheet();
```

`setNextPromptResult({ buttonIndex, text, password? })` does the same for a prompt; the button's `onPress` receives `{ text, password? }`.

Prefer these over `mockResolvedValueOnce`, which replaces the implementation and so skips `onPress`. `dismissActionSheet` and `dismissAllActionSheets` are spies. Every mocked sheet or prompt calls its `onShow` before resolving, since it always "appears".

## End-to-end tests

Give buttons a `testID` to find them in Detox, Maestro, Appium, XCUITest or UiAutomator tests:

```ts
showActionSheetWithOptions({
  options: [
    { label: 'Delete', style: 'destructive', testID: 'item-delete' },
    { label: 'Cancel', style: 'cancel', testID: 'item-cancel' },
  ],
});
```

| Platform | Where the `testID` goes | Matched by |
| --- | --- | --- |
| iOS | the action's or row's `accessibilityIdentifier`, in every style including alerts and prompts | XCUITest, Detox, Maestro, Appium |
| Android | the row's view tag, and its accessibility resource id | Detox (tag); UiAutomator, Maestro, Appium (resource id) |

For example, in Maestro: `- tapOn: { id: "item-delete" }`.

The sheet itself and a prompt's text fields take ids too, so a test can wait for a sheet to appear and type into a prompt:

```ts
showPromptWithOptions({
  title: 'Sign in',
  type: 'login-password',
  testID: 'sign-in-prompt',
  fieldTestID: 'sign-in-email',
  passwordFieldTestID: 'sign-in-password',
  options: [{ label: 'Sign in', testID: 'sign-in-submit' }],
});
```

```yaml
# Maestro
- assertVisible: { id: "sign-in-prompt" }
- tapOn: { id: "sign-in-email" }
- inputText: "ann@example.com"
- tapOn: { id: "sign-in-password" }
- inputText: "hunter22"
- tapOn: { id: "sign-in-submit" }
```

A sheet's `testID` goes on its alert or sheet view on iOS (`accessibilityIdentifier`), and on its dialog's content view on Android (tag and resource id). Field ids go on the text fields the same way.
