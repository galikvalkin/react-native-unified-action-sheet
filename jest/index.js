/* global jest */
/**
 * A drop-in mock of the public API, so a screen that opens a sheet can be
 * tested without the native module.
 *
 *   jest.mock('react-native-unified-action-sheet', () =>
 *     require('react-native-unified-action-sheet/jest')
 *   );
 *
 * By default every sheet resolves with no selection. To simulate a tap, queue
 * the index the next sheet should resolve with; the pressed button's onPress
 * runs, exactly as it would in the real module:
 *
 *   setNextButtonIndex(0);
 *   await openTheSheet();
 *
 * Prefer that over mockResolvedValueOnce, which replaces the implementation and
 * so skips onPress.
 *
 * A prompt is queued the same way, with the text the field should resolve with:
 *
 *   setNextPromptResult({ buttonIndex: 0, text: 'typed' });
 *   await openThePrompt();
 */
let nextButtonIndex;

const setNextButtonIndex = (index) => {
  nextButtonIndex = index;
};

const showActionSheetWithOptions = jest.fn((options) => {
  const buttonIndex = nextButtonIndex;
  nextButtonIndex = undefined;

  if (buttonIndex != null) {
    const button = options && options.options && options.options[buttonIndex];
    if (button && typeof button.onPress === 'function') button.onPress();
  }

  return Promise.resolve(buttonIndex);
});

let nextPromptResult;

const setNextPromptResult = (result) => {
  nextPromptResult = result;
};

const showPromptWithOptions = jest.fn((options) => {
  const result = nextPromptResult;
  nextPromptResult = undefined;

  if (result) {
    const button =
      options && options.options && options.options[result.buttonIndex];
    if (button && typeof button.onPress === 'function') {
      button.onPress(result.text);
    }
  }

  return Promise.resolve(result);
});

const dismissActionSheet = jest.fn();
const dismissAllActionSheets = jest.fn();

module.exports = {
  setNextButtonIndex,
  setNextPromptResult,
  showActionSheetWithOptions,
  showPromptWithOptions,
  dismissActionSheet,
  dismissAllActionSheets,
};
