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

Prefer these over `mockResolvedValueOnce`, which replaces the implementation and so skips `onPress`. `dismissActionSheet` and `dismissAllActionSheets` are spies.
