/* global jest */
/**
 * A drop-in mock of the public API, so a screen that opens a sheet can be
 * tested without the native module.
 *
 *   jest.mock('react-native-unified-action-sheet', () =>
 *     require('react-native-unified-action-sheet/jest')
 *   );
 *
 * By default every sheet resolves as dismissed: { reason: 'dismissed',
 * buttonIndex: undefined }. To simulate a tap, queue the index the next sheet
 * should resolve with; it resolves { reason, buttonIndex } with the reason the
 * real module would give ('cancelled' for the cancel button or -1, otherwise
 * 'selected'), and the pressed button's onPress runs as it would for real:
 *
 *   setNextButtonIndex(0);
 *   await openTheSheet();
 *
 * Prefer that over mockResolvedValueOnce, which replaces the implementation and
 * so skips onPress.
 *
 * As for real, the result carries the value of the button it points at, when
 * that button has one.
 *
 * Each mocked sheet or prompt calls its onShow before resolving, since it
 * always "appears".
 *
 * A prompt is queued the same way, with what the field(s) should hold (password
 * only for a 'login-password' prompt); onPress receives { text, password }:
 *
 *   setNextPromptResult({ buttonIndex: 0, text: 'typed' });
 *   await openThePrompt();
 */
const buttonsOf = (options) => (options && options.options) || [];

/// A mocked sheet always appears, so onShow runs first, as it would for real.
const callOnShow = (options) => {
  if (options && typeof options.onShow === 'function') options.onShow();
};

/// The same rule as the real module: the first button styled 'cancel', or -1,
/// is a cancellation; any other index is a selection. The result carries the
/// value of the button it points at, if that button has one.
const closeResult = (buttons, buttonIndex) => {
  if (buttonIndex == null)
    return { reason: 'dismissed', buttonIndex: undefined };

  const cancelIndex = buttons.findIndex((button) => button.style === 'cancel');
  const cancelled = buttonIndex < 0 || buttonIndex === cancelIndex;
  const button = buttons[buttonIndex];
  const result = { reason: cancelled ? 'cancelled' : 'selected', buttonIndex };

  return button && button.value !== undefined
    ? { ...result, value: button.value }
    : result;
};

let nextButtonIndex;

const setNextButtonIndex = (index) => {
  nextButtonIndex = index;
};

const showActionSheetWithOptions = jest.fn((options) => {
  callOnShow(options);
  const buttons = buttonsOf(options);
  const result = closeResult(buttons, nextButtonIndex);
  nextButtonIndex = undefined;

  const button = result.buttonIndex != null && buttons[result.buttonIndex];
  if (button && typeof button.onPress === 'function') button.onPress();

  return Promise.resolve(result);
});

let nextPromptResult;

const setNextPromptResult = (result) => {
  nextPromptResult = result;
};

const showPromptWithOptions = jest.fn((options) => {
  callOnShow(options);
  const buttons = buttonsOf(options);
  const queued = nextPromptResult;
  nextPromptResult = undefined;

  const values = { text: (queued && queued.text) || '' };
  if (queued && queued.password != null) values.password = queued.password;
  const result = {
    ...closeResult(buttons, queued ? queued.buttonIndex : undefined),
    ...values,
  };

  const button = result.buttonIndex != null && buttons[result.buttonIndex];
  if (button && typeof button.onPress === 'function') button.onPress(values);

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
