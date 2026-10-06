import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type AnyMock = ReturnType<typeof jest.fn>;

let mockNativeResponse: Promise<number>;
let mockPromptResponse: Promise<{
  buttonIndex: number;
  text: string;
  password: string;
}>;
let mockMaterialEnabled: boolean;

// processColor stands in for React Native's: ARGB numbers for the formats it
// knows, null for anything it can't parse.
const mockColors: Record<string, number> = {
  '#FF000080': 0x80ff0000,
  '#F00': 0xffff0000,
  'green': 0xff008000,
  '#123456': 0xff123456,
};

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  processColor: (color: unknown) =>
    typeof color === 'string' ? (mockColors[color] ?? null) : null,
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
      tintColor: '#123456',
      presentationStyle: 'anchored',
      anchorAlignment: 'center',
      buttonTextAlignment: 'center',
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({
      title: 'T',
      message: 'M',
      tintColor: 0xff123456,
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

describe('wire buttons', () => {
  it('sends the buttons as objects, without onPress', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({
      options: [
        { label: 'Delete', style: 'destructive', onPress: () => {} },
        { label: 'Erase', style: 'destructive' },
        { label: 'Archive', disabled: true },
        { label: 'Cancel', style: 'cancel' },
      ],
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toEqual({
      buttons: [
        { label: 'Delete', style: 'destructive' },
        { label: 'Erase', style: 'destructive' },
        { label: 'Archive', disabled: true },
        { label: 'Cancel', style: 'cancel' },
      ],
    });
  });

  it('keeps cancel on the first button styled cancel only', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({
      options: [
        { label: 'Nope', style: 'cancel' },
        { label: 'Cancel', style: 'cancel' },
      ],
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toEqual({
      buttons: [{ label: 'Nope', style: 'cancel' }, { label: 'Cancel' }],
    });
  });

  it('sends bare labels when nothing is set', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({ options: buttons('A', 'B') });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toEqual({ buttons: [{ label: 'A' }, { label: 'B' }] });
  });

  it('allows a disabled destructive button', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');

    await showActionSheetWithOptions({
      options: [{ label: 'Delete', style: 'destructive', disabled: true }],
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).toEqual({
      buttons: [{ label: 'Delete', style: 'destructive', disabled: true }],
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
    const { showActionSheetWithOptions } = loadIndex('windows' as 'ios');

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
    const { dismissAllActionSheets } = loadIndex('windows' as 'ios');

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
  it('sends buttons the way the sheet does', async () => {
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

    // Exact on purpose: nothing else, a caller's onShow included, may reach
    // the wire options. onShow travels as the second argument.
    expect(mockedNative().showPromptWithOptions).toHaveBeenCalledWith(
      {
        title: 'Rename',
        placeholder: 'New name',
        buttons: [
          { label: 'Save' },
          { label: 'Delete', style: 'destructive' },
          { label: 'Nope', disabled: true },
          { label: 'Cancel', style: 'cancel' },
        ],
        type: 'plain-text',
      },
      expect.any(Function)
    );
  });

  it('keeps onShow off the wire options, even when set', async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } =
      loadIndex('ios');
    const onShow = jest.fn();

    await showActionSheetWithOptions({ options: buttons('A'), onShow });
    await showPromptWithOptions({ options: buttons('OK'), onShow });

    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).not.toHaveProperty('onShow');
    expect(
      mockedNative().showPromptWithOptions.mock.calls[0]![0]
    ).not.toHaveProperty('onShow');
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
    const { showPromptWithOptions } = loadIndex('windows' as 'ios');

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

    const expected = {
      buttons: [
        { label: 'A' },
        { label: 'B', preferred: true },
        { label: 'C' },
      ],
    };
    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).toMatchObject(expected);
    expect(
      mockedNative().showPromptWithOptions.mock.calls[0]![0]
    ).toMatchObject(expected);
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

  it('marks the buttons that require text, and only those', async () => {
    const { showPromptWithOptions } = loadIndex('ios');

    await showPromptWithOptions({
      options: [
        { label: 'Save', requiresText: true },
        { label: 'Cancel', style: 'cancel' },
      ],
    });

    const [passed] = mockedNative().showPromptWithOptions.mock.calls[0]!;
    expect(passed).toMatchObject({
      buttons: [
        { label: 'Save', requiresText: true },
        { label: 'Cancel', style: 'cancel' },
      ],
    });
  });
});

describe('testID', () => {
  it("sends each button's testID, and none where unset", async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } =
      loadIndex('ios');
    const options = [
      { label: 'Share', testID: 'sheet-share' },
      { label: 'Copy' },
      { label: 'Cancel', style: 'cancel' as const, testID: 'sheet-cancel' },
    ];

    await showActionSheetWithOptions({ options });
    await showPromptWithOptions({ options });

    const expected = {
      buttons: [
        { label: 'Share', testID: 'sheet-share' },
        { label: 'Copy' },
        { label: 'Cancel', style: 'cancel', testID: 'sheet-cancel' },
      ],
    };
    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).toMatchObject(expected);
    expect(
      mockedNative().showPromptWithOptions.mock.calls[0]![0]
    ).toMatchObject(expected);
  });
});

describe('onShow', () => {
  it("always passes native a function that calls the caller's onShow", async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } =
      loadIndex('android');
    const onShow = jest.fn();

    await showActionSheetWithOptions({ options: buttons('A'), onShow });
    await showPromptWithOptions({ options: buttons('OK'), onShow });

    const sheetOnShow = mockedNative().showActionSheetWithOptions.mock
      .calls[0]![1] as () => void;
    const promptOnShow = mockedNative().showPromptWithOptions.mock
      .calls[0]![1] as () => void;
    expect(onShow).not.toHaveBeenCalled();
    sheetOnShow();
    promptOnShow();
    expect(onShow).toHaveBeenCalledTimes(2);
  });

  it('passes a harmless function when the caller has no onShow', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');

    await showActionSheetWithOptions({ options: buttons('A') });

    const nativeOnShow = mockedNative().showActionSheetWithOptions.mock
      .calls[0]![1] as () => void;
    expect(typeof nativeOnShow).toBe('function');
    expect(() => nativeOnShow()).not.toThrow();
  });

  it('is never called on an unsupported platform', async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } = loadIndex(
      'windows' as 'ios'
    );
    const onShow = jest.fn();

    await showActionSheetWithOptions({ options: buttons('A'), onShow });
    await showPromptWithOptions({ options: buttons('OK'), onShow });

    expect(onShow).not.toHaveBeenCalled();
  });
});

describe('accessibility labels and hints', () => {
  it('sends them on their buttons, and none where unset', async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } =
      loadIndex('android');
    const options = [
      {
        label: '🗑',
        accessibilityLabel: 'Delete',
        accessibilityHint: 'Removes the item',
      },
      { label: 'Copy' },
      {
        label: 'Cancel',
        style: 'cancel' as const,
        accessibilityHint: 'Keeps the item',
      },
    ];

    await showActionSheetWithOptions({ options });
    await showPromptWithOptions({ options });

    const expected = {
      buttons: [
        {
          label: '🗑',
          accessibilityLabel: 'Delete',
          accessibilityHint: 'Removes the item',
        },
        { label: 'Copy' },
        {
          label: 'Cancel',
          style: 'cancel',
          accessibilityHint: 'Keeps the item',
        },
      ],
    };
    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).toMatchObject(expected);
    expect(
      mockedNative().showPromptWithOptions.mock.calls[0]![0]
    ).toMatchObject(expected);
  });
});

describe('sheet and field testIDs', () => {
  it('passes the sheet testID and prompt field testIDs through', async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } =
      loadIndex('ios');

    await showActionSheetWithOptions({
      options: buttons('A'),
      testID: 'share-sheet',
    });
    await showPromptWithOptions({
      options: buttons('Sign in'),
      type: 'login-password',
      testID: 'sign-in-prompt',
      fieldTestID: 'sign-in-email',
      passwordFieldTestID: 'sign-in-password',
    });

    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).toMatchObject({ testID: 'share-sheet' });
    expect(
      mockedNative().showPromptWithOptions.mock.calls[0]![0]
    ).toMatchObject({
      testID: 'sign-in-prompt',
      fieldTestID: 'sign-in-email',
      passwordFieldTestID: 'sign-in-password',
    });
  });
});

describe('anchor measurement', () => {
  it('opens unanchored when measureInWindow never answers', async () => {
    jest.useFakeTimers();
    try {
      const { showActionSheetWithOptions } = loadIndex('android');
      const silentAnchor = { measureInWindow: jest.fn() };

      const result = showActionSheetWithOptions({
        options: buttons('A'),
        presentationStyle: 'anchored',
        anchor: silentAnchor,
      });
      await jest.advanceTimersByTimeAsync(1000);

      expect(silentAnchor.measureInWindow).toHaveBeenCalledTimes(1);
      expect(mockedNative().showActionSheetWithOptions).toHaveBeenCalledTimes(
        1
      );
      const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
      expect(passed).not.toHaveProperty('anchorRect');
      await expect(result).resolves.toMatchObject({ reason: 'selected' });
    } finally {
      jest.useRealTimers();
    }
  });

  it('ignores a measurement that answers after the timeout', async () => {
    jest.useFakeTimers();
    try {
      const { showActionSheetWithOptions } = loadIndex('ios');
      let answer:
        ((x: number, y: number, w: number, h: number) => void) | undefined;
      const lateAnchor = {
        measureInWindow: jest.fn((cb: typeof answer) => {
          answer = cb;
        }),
      };

      const result = showActionSheetWithOptions({
        options: buttons('A'),
        anchor: lateAnchor,
      });
      await jest.advanceTimersByTimeAsync(1000);
      answer?.(1, 2, 3, 4);
      await result;

      expect(mockedNative().showActionSheetWithOptions).toHaveBeenCalledTimes(
        1
      );
      const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
      expect(passed).not.toHaveProperty('anchorRect');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('colors', () => {
  it('sends colors as numbers, parsed the way React Native does', async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } =
      loadIndex('android');
    const colors = {
      tintColor: '#FF000080',
      cancelButtonTintColor: '#F00',
      destructiveColor: 'green',
    };

    await showActionSheetWithOptions({ options: buttons('A'), ...colors });
    await showPromptWithOptions({ options: buttons('OK'), ...colors });

    const expected = {
      tintColor: 0x80ff0000,
      cancelButtonTintColor: 0xffff0000,
      destructiveColor: 0xff008000,
    };
    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).toMatchObject(expected);
    expect(
      mockedNative().showPromptWithOptions.mock.calls[0]![0]
    ).toMatchObject(expected);
  });

  it('drops a color React Native cannot parse', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');

    await showActionSheetWithOptions({
      options: buttons('A'),
      tintColor: 'not-a-color',
      destructiveColor: '#123456',
    });

    const [passed] = mockedNative().showActionSheetWithOptions.mock.calls[0]!;
    expect(passed).not.toHaveProperty('tintColor');
    expect(passed).toMatchObject({ destructiveColor: 0xff123456 });
  });
});

describe('button values', () => {
  it('resolves the value of the selected button', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');
    mockNativeResponse = Promise.resolve(1);

    const result = await showActionSheetWithOptions({
      options: [
        { label: 'Share', value: 'share' },
        { label: 'Copy', value: 'copy' },
      ],
    });

    expect(result).toEqual({
      reason: 'selected',
      buttonIndex: 1,
      value: 'copy',
    });
  });

  it("resolves the cancel button's value on a cancellation", async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.resolve(1);

    const result = await showActionSheetWithOptions({
      options: [
        { label: 'Share', value: 'share' },
        { label: 'Cancel', style: 'cancel', value: 'none' },
      ],
    });

    expect(result).toEqual({
      reason: 'cancelled',
      buttonIndex: 1,
      value: 'none',
    });
  });

  it('carries no value on a dismissal, at -1, or for a button without one', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');
    const options = [{ label: 'Share', value: 'share' }, { label: 'Copy' }];

    mockNativeResponse = Promise.resolve(-2);
    expect(await showActionSheetWithOptions({ options })).not.toHaveProperty(
      'value'
    );
    mockNativeResponse = Promise.resolve(-1);
    expect(await showActionSheetWithOptions({ options })).not.toHaveProperty(
      'value'
    );
    mockNativeResponse = Promise.resolve(1);
    expect(await showActionSheetWithOptions({ options })).not.toHaveProperty(
      'value'
    );
  });

  it('keeps values off the wire', async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } =
      loadIndex('ios');
    const options = [{ label: 'A', value: { id: 1 } }];

    await showActionSheetWithOptions({ options });
    await showPromptWithOptions({ options });

    expect(
      mockedNative().showActionSheetWithOptions.mock.calls[0]![0]
    ).toMatchObject({ buttons: [{ label: 'A' }] });
    expect(
      JSON.stringify(mockedNative().showActionSheetWithOptions.mock.calls[0])
    ).not.toContain('"value"');
    expect(
      JSON.stringify(mockedNative().showPromptWithOptions.mock.calls[0])
    ).not.toContain('"value"');
  });

  it('resolves the value with a prompt result, text included', async () => {
    const { showPromptWithOptions } = loadIndex('android');
    mockPromptResponse = Promise.resolve({
      buttonIndex: 0,
      text: 'Notes',
      password: '',
    });

    const result = await showPromptWithOptions({
      options: [{ label: 'Save', value: 'save' }, { label: 'Cancel' }],
    });

    expect(result).toEqual({
      reason: 'selected',
      buttonIndex: 0,
      text: 'Notes',
      value: 'save',
    });
  });

  it('types the value as the union of the buttons’ values', async () => {
    const { showActionSheetWithOptions, showPromptWithOptions } =
      loadIndex('ios');

    const sheet = await showActionSheetWithOptions({
      options: [
        { label: 'Share', value: 'share' },
        { label: 'Copy', value: 'copy' },
        { label: 'Cancel', style: 'cancel' },
      ],
    });
    const prompt = await showPromptWithOptions({
      options: [{ label: 'Save', value: 1 }],
    });

    // Compile-time checks: typecheck fails if the literals are widened.
    const sheetValue: 'share' | 'copy' | undefined = sheet.value;
    const promptValue: 1 | undefined = prompt.value;
    // @ts-expect-error 'paste' is not one of the buttons' values.
    const notAValue: 'paste' | undefined = sheet.value;

    expect([sheetValue, promptValue, notAValue]).toHaveLength(3);
  });
});
