import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type AnyMock = ReturnType<typeof jest.fn>;

let mockNativeResponse: Promise<number>;
let mockPromptResponse: Promise<{
  buttonIndex: number;
  text: string;
  password: string;
}>;
let mockMaterialEnabled: boolean;

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('../NativeUnifiedActionSheet', () => {
  return {
    default: {
      showActionSheetWithOptions: jest.fn(() => mockNativeResponse),
      showPromptWithOptions: jest.fn(() => mockPromptResponse),
      getConstants: jest.fn(() => ({ isMaterialEnabled: mockMaterialEnabled })),
      dismissActionSheet: jest.fn(),
      dismissAllActionSheets: jest.fn(),
    },
  };
});

type IndexModule = typeof import('../index');
type MockedReactNative = {
  Platform: { OS: string };
};
type MockedNative = {
  showActionSheetWithOptions: AnyMock;
  showPromptWithOptions: AnyMock;
  getConstants: AnyMock;
  dismissActionSheet: AnyMock;
  dismissAllActionSheets: AnyMock;
};

const loadIndex = (os: 'ios' | 'android'): IndexModule => {
  jest.resetModules();
  const rn = jest.requireMock('react-native') as MockedReactNative;
  rn.Platform.OS = os;
  return require('../index');
};

const mockedNative = (): MockedNative =>
  (jest.requireMock('../NativeUnifiedActionSheet') as { default: MockedNative })
    .default;

beforeEach(() => {
  jest.clearAllMocks();
  mockNativeResponse = Promise.resolve(0);
  mockPromptResponse = Promise.resolve({
    buttonIndex: 0,
    text: '',
    password: '',
  });
  mockMaterialEnabled = false;
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
});

const buttons = (...labels: string[]) => labels.map((label) => ({ label }));

describe('iOS', () => {
  it('routes to the native module', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');
    mockNativeResponse = Promise.resolve(1);

    const result = await showActionSheetWithOptions({
      options: buttons('A', 'Cancel'),
    });

    expect(mockedNative().showActionSheetWithOptions).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ reason: 'selected', buttonIndex: 1 });
  });

  it('measures a ref anchor and forwards it as a rect', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');
    const measureInWindow = jest.fn(
      (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(10, 20, 30, 40)
    );

    await showActionSheetWithOptions({
      options: buttons('A'),
      anchor: { current: { measureInWindow } },
    });

    expect(measureInWindow).toHaveBeenCalledTimes(1);
    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({
      anchorRect: { x: 10, y: 20, width: 30, height: 40 },
    });
    expect(passed).not.toHaveProperty('anchor');
  });

  it('accepts a measurable instance as well as a ref object', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    const measureInWindow = jest.fn(
      (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(1, 2, 3, 4)
    );

    await showActionSheetWithOptions({
      options: buttons('A'),
      anchor: { measureInWindow },
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({
      anchorRect: { x: 1, y: 2, width: 3, height: 4 },
    });
  });

  it('sends no rect for an unset or detached anchor', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');

    await showActionSheetWithOptions({ options: buttons('A') });
    await showActionSheetWithOptions({
      options: buttons('A'),
      anchor: { current: null },
    });

    for (const call of mockedNative().showActionSheetWithOptions.mock.calls) {
      expect(call[0]).not.toHaveProperty('anchorRect');
    }
  });

  it('delegates dismissActionSheet to the native module', () => {
    const { dismissActionSheet } = loadIndex('ios');

    dismissActionSheet();

    expect(mockedNative().dismissActionSheet).toHaveBeenCalledTimes(1);
  });
});

describe('Android', () => {
  it('passes non-button options through untouched', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({
      options: buttons('A'),
      title: 'T',
      message: 'M',
      tintColor: '#111111',
      presentationStyle: 'anchored',
      anchorAlignment: 'center',
      buttonTextAlignment: 'center',
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({
      title: 'T',
      message: 'M',
      tintColor: '#111111',
      presentationStyle: 'anchored',
      anchorAlignment: 'center',
      buttonTextAlignment: 'center',
    });
  });

  it('delegates dismissActionSheet to the native module', () => {
    const { dismissActionSheet } = loadIndex('android');

    dismissActionSheet();

    expect(mockedNative().dismissActionSheet).toHaveBeenCalledTimes(1);
  });
});

describe('button flattening', () => {
  it('derives labels and every index set from the buttons', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({
      options: [
        { label: 'Delete', style: 'destructive' },
        { label: 'Erase', style: 'destructive' },
        { label: 'Archive', disabled: true },
        { label: 'Cancel', style: 'cancel' },
      ],
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({
      options: ['Delete', 'Erase', 'Archive', 'Cancel'],
      destructiveButtonIndices: [0, 1],
      disabledButtonIndices: [2],
      cancelButtonIndex: 3,
    });
  });

  it('takes only the first button styled cancel', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({
      options: [
        { label: 'Nope', style: 'cancel' },
        { label: 'Cancel', style: 'cancel' },
      ],
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({ cancelButtonIndex: 0 });
  });

  it('omits the index sets entirely when nothing is styled', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({ options: buttons('A', 'B') });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toEqual({ options: ['A', 'B'] });
  });

  it('allows a disabled destructive button', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({
      options: [{ label: 'Delete', style: 'destructive', disabled: true }],
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({
      destructiveButtonIndices: [0],
      disabledButtonIndices: [0],
    });
  });
});

describe('promise API', () => {
  it('resolves the tapped index as selected', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.resolve(1);

    await expect(
      showActionSheetWithOptions({ options: buttons('A', 'B') })
    ).resolves.toEqual({ reason: 'selected', buttonIndex: 1 });
  });

  it("reports the cancel button's index as cancelled", async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');
    mockNativeResponse = Promise.resolve(1);

    await expect(
      showActionSheetWithOptions({
        options: [{ label: 'A' }, { label: 'Cancel', style: 'cancel' }],
      })
    ).resolves.toEqual({ reason: 'cancelled', buttonIndex: 1 });
  });

  it('reports a cancel gesture with no cancel button as cancelled at -1', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.resolve(-1);

    await expect(
      showActionSheetWithOptions({ options: buttons('A', 'B') })
    ).resolves.toEqual({ reason: 'cancelled', buttonIndex: -1 });
  });

  it('resolves as dismissed, with no index, when dismissed programmatically', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.resolve(-2);

    await expect(
      showActionSheetWithOptions({
        options: [{ label: 'A' }, { label: 'Cancel', style: 'cancel' }],
      })
    ).resolves.toEqual({ reason: 'dismissed', buttonIndex: undefined });
  });

  it('resolves as cancelled instead of rejecting', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.reject(new Error('E_NO_ACTIVITY'));

    await expect(
      showActionSheetWithOptions({
        options: [{ label: 'A' }, { label: 'Cancel', style: 'cancel' }],
      })
    ).resolves.toEqual({ reason: 'cancelled', buttonIndex: 1 });
  });

  it('resolves -1 on rejection when there is no cancel button', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.reject(new Error('E_NO_ACTIVITY'));

    await expect(
      showActionSheetWithOptions({ options: buttons('A', 'B') })
    ).resolves.toEqual({ reason: 'cancelled', buttonIndex: -1 });
  });

  it('resolves as dismissed on unsupported platforms', async () => {
    const { showActionSheetWithOptions } = loadIndex('web' as 'ios');

    await expect(
      showActionSheetWithOptions({ options: buttons('A') })
    ).resolves.toEqual({ reason: 'dismissed', buttonIndex: undefined });
    expect(mockedNative().showActionSheetWithOptions).not.toHaveBeenCalled();
  });
});

describe('dismissAllActionSheets', () => {
  it('delegates to the native module', () => {
    const { dismissAllActionSheets } = loadIndex('ios');

    dismissAllActionSheets();

    expect(mockedNative().dismissAllActionSheets).toHaveBeenCalledTimes(1);
  });

  it('is a no-op on unsupported platforms', () => {
    const { dismissAllActionSheets } = loadIndex('web' as 'ios');

    dismissAllActionSheets();

    expect(mockedNative().dismissAllActionSheets).not.toHaveBeenCalled();
  });
});

describe('per-button onPress', () => {
  it("runs the pressed button's handler", async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    const onShare = jest.fn();
    const onDelete = jest.fn();
    mockNativeResponse = Promise.resolve(1);

    await showActionSheetWithOptions({
      options: [
        { label: 'Share', onPress: onShare },
        { label: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onShare).not.toHaveBeenCalled();
  });

  it('treats a dismissal that resolves the cancel button as pressing it', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    const onCancel = jest.fn();
    mockNativeResponse = Promise.resolve(1);

    await showActionSheetWithOptions({
      options: [
        { label: 'Share' },
        { label: 'Cancel', style: 'cancel', onPress: onCancel },
      ],
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('runs nothing when dismissed programmatically', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    const onPress = jest.fn();
    mockNativeResponse = Promise.resolve(-2);

    await showActionSheetWithOptions({ options: [{ label: 'A', onPress }] });

    expect(onPress).not.toHaveBeenCalled();
  });

  it('fires the cancel handler when the native side fails, since that is the index it resolves', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    const onCancel = jest.fn();
    mockNativeResponse = Promise.reject(new Error('E_NO_ACTIVITY'));

    await expect(
      showActionSheetWithOptions({
        options: [
          { label: 'A' },
          { label: 'Cancel', style: 'cancel', onPress: onCancel },
        ],
      })
    ).resolves.toEqual({ reason: 'cancelled', buttonIndex: 1 });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('runs nothing when -1 indexes no button', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    const onPress = jest.fn();
    mockNativeResponse = Promise.reject(new Error('E_NO_ACTIVITY'));

    await expect(
      showActionSheetWithOptions({ options: [{ label: 'A', onPress }] })
    ).resolves.toEqual({ reason: 'cancelled', buttonIndex: -1 });
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('showPromptWithOptions', () => {
  it('flattens buttons into labels and index sets, like the sheet does', async () => {
    const { showPromptWithOptions } = loadIndex('android');

    await showPromptWithOptions({
      title: 'Rename',
      placeholder: 'New name',
      options: [
        { label: 'Save' },
        { label: 'Delete', style: 'destructive' },
        { label: 'Nope', disabled: true },
        { label: 'Cancel', style: 'cancel' },
      ],
    });

    expect(mockedNative().showPromptWithOptions).toHaveBeenCalledWith({
      title: 'Rename',
      placeholder: 'New name',
      options: ['Save', 'Delete', 'Nope', 'Cancel'],
      cancelButtonIndex: 3,
      destructiveButtonIndices: [1],
      disabledButtonIndices: [2],
      type: 'plain-text',
    });
  });

  it('resolves the index, reason and text, and passes the text to onPress', async () => {
    const { showPromptWithOptions } = loadIndex('ios');
    const onPress = jest.fn();
    mockPromptResponse = Promise.resolve({
      buttonIndex: 0,
      text: 'typed',
      password: '',
    });

    await expect(
      showPromptWithOptions({ options: [{ label: 'OK', onPress }] })
    ).resolves.toEqual({ reason: 'selected', buttonIndex: 0, text: 'typed' });
    expect(onPress).toHaveBeenCalledWith({ text: 'typed' });
  });

  it('keeps the draft on a programmatic dismiss and runs no handler', async () => {
    const { showPromptWithOptions } = loadIndex('ios');
    const onPress = jest.fn();
    mockPromptResponse = Promise.resolve({
      buttonIndex: -2,
      text: 'draft',
      password: '',
    });

    await expect(
      showPromptWithOptions({ options: [{ label: 'OK', onPress }] })
    ).resolves.toEqual({
      reason: 'dismissed',
      buttonIndex: undefined,
      text: 'draft',
    });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('maps a rejection to the cancel index with empty text', async () => {
    const { showPromptWithOptions } = loadIndex('android');
    const onPress = jest.fn();
    mockPromptResponse = Promise.reject(new Error('E_NO_ACTIVITY'));

    await expect(
      showPromptWithOptions({
        options: [
          { label: 'OK' },
          { label: 'Cancel', style: 'cancel', onPress },
        ],
      })
    ).resolves.toEqual({ reason: 'cancelled', buttonIndex: 1, text: '' });
    expect(onPress).toHaveBeenCalledWith({ text: '' });
  });

  it('resolves as dismissed on an unsupported platform without calling native', async () => {
    const { showPromptWithOptions } = loadIndex('web' as 'ios');

    await expect(
      showPromptWithOptions({ options: [{ label: 'OK' }] })
    ).resolves.toEqual({
      reason: 'dismissed',
      buttonIndex: undefined,
      text: '',
    });
    expect(mockedNative().showPromptWithOptions).not.toHaveBeenCalled();
  });
});

describe("presentationStyle 'bottom'", () => {
  const measurableAnchor = () => ({
    measureInWindow: jest.fn(
      (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(1, 2, 3, 4)
    ),
  });

  let warn: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('passes the style through and measures no anchor', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');
    const anchor = measurableAnchor();

    await showActionSheetWithOptions({
      options: buttons('A'),
      presentationStyle: 'bottom',
      anchor,
    });

    expect(anchor.measureInWindow).not.toHaveBeenCalled();
    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({ presentationStyle: 'bottom' });
    expect(passed).not.toHaveProperty('anchorRect');
  });

  it('warns once on Android when Material is not enabled, and still shows the sheet', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({
      options: buttons('A'),
      presentationStyle: 'bottom',
    });
    await showActionSheetWithOptions({
      options: buttons('A'),
      presentationStyle: 'bottom',
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain(
      'unifiedActionSheet.material=true'
    );
    expect(mockedNative().showActionSheetWithOptions).toHaveBeenCalledTimes(2);
  });

  it('does not warn when Material is enabled', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockMaterialEnabled = true;

    await showActionSheetWithOptions({
      options: buttons('A'),
      presentationStyle: 'bottom',
    });

    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn on iOS, which needs no opt-in', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');

    await showActionSheetWithOptions({
      options: buttons('A'),
      presentationStyle: 'bottom',
    });

    expect(warn).not.toHaveBeenCalled();
    expect(mockedNative().getConstants).not.toHaveBeenCalled();
  });

  it('does not warn outside development', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;

    await showActionSheetWithOptions({
      options: buttons('A'),
      presentationStyle: 'bottom',
    });

    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn for the other styles', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({ options: buttons('A') });
    await showActionSheetWithOptions({
      options: buttons('A'),
      presentationStyle: 'centered',
    });

    expect(warn).not.toHaveBeenCalled();
    expect(mockedNative().getConstants).not.toHaveBeenCalled();
  });
});

describe('preferred button', () => {
  it('sends the first preferred button, for sheets and prompts', async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } =
      loadIndex('ios');
    const options = [
      { label: 'A' },
      { label: 'B', preferred: true },
      { label: 'C', preferred: true },
    ];

    await showActionSheetWithOptions({ options });
    await showPromptWithOptions({ options });

    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).toMatchObject({ preferredButtonIndex: 1 });
    expect(
      mockedNative().showPromptWithOptions.mock.calls[0]![0]
    ).toMatchObject({ preferredButtonIndex: 1 });
  });

  it('sends nothing when no button is preferred', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({ options: buttons('A', 'B') });

    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).not.toHaveProperty('preferredButtonIndex');
  });
});

describe('detents', () => {
  it('passes them through to the native side', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({
      options: buttons('A'),
      presentationStyle: 'bottom',
      detents: ['medium', 'large'],
    });

    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).toMatchObject({ detents: ['medium', 'large'] });
  });
});

describe('prompt types', () => {
  it('maps secureTextEntry onto the secure-text type', async () => {
    const { showPromptWithOptions } = loadIndex('ios');

    await showPromptWithOptions({
      options: buttons('OK'),
      secureTextEntry: true,
    });

    const [passed] = mockedNative().showPromptWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({ type: 'secure-text' });
    expect(passed).not.toHaveProperty('secureTextEntry');
  });

  it('lets an explicit type win over secureTextEntry', async () => {
    const { showPromptWithOptions } = loadIndex('ios');

    await showPromptWithOptions({
      options: buttons('OK'),
      secureTextEntry: true,
      type: 'plain-text',
    });

    expect(
      mockedNative().showPromptWithOptions.mock.calls[0]![0]
    ).toMatchObject({ type: 'plain-text' });
  });

  it('resolves and hands over the password for login-password', async () => {
    const { showPromptWithOptions } = loadIndex('android');
    const onPress = jest.fn();
    mockPromptResponse = Promise.resolve({
      buttonIndex: 0,
      text: 'ann',
      password: 's3cret',
    });

    await expect(
      showPromptWithOptions({
        type: 'login-password',
        options: [{ label: 'Sign in', onPress }, { label: 'Cancel' }],
      })
    ).resolves.toEqual({
      reason: 'selected',
      buttonIndex: 0,
      text: 'ann',
      password: 's3cret',
    });
    expect(onPress).toHaveBeenCalledWith({ text: 'ann', password: 's3cret' });
  });

  it('sends the buttons that require text, and omits the set when none do', async () => {
    const { showPromptWithOptions } = loadIndex('ios');

    await showPromptWithOptions({
      options: [
        { label: 'Save', requiresText: true },
        { label: 'Cancel', style: 'cancel' },
      ],
    });
    await showPromptWithOptions({ options: buttons('OK') });

    const calls = mockedNative().showPromptWithOptions.mock.calls;
    expect(calls[0]![0]).toMatchObject({ textRequiredButtonIndices: [0] });
    expect(calls[1]![0]).not.toHaveProperty('textRequiredButtonIndices');
  });
});
