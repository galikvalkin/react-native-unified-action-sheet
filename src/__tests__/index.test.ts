import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type AnyMock = ReturnType<typeof jest.fn>;

let mockNativeResponse: Promise<number>;

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('../NativeUnifiedActionSheet', () => {
  return {
    default: {
      showActionSheetWithOptions: jest.fn(() => mockNativeResponse),
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
});

const buttons = (...labels: string[]) => labels.map((label) => ({ label }));

describe('iOS', () => {
  it('routes to the native module', async () => {
    const { showActionSheetWithOptions } = loadIndex('ios');
    mockNativeResponse = Promise.resolve(1);

    const index = await showActionSheetWithOptions({
      options: buttons('A', 'Cancel'),
    });

    expect(mockedNative().showActionSheetWithOptions).toHaveBeenCalledTimes(1);
    expect(index).toBe(1);
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
  it('resolves with the tapped index', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.resolve(1);

    await expect(
      showActionSheetWithOptions({ options: buttons('A', 'B') })
    ).resolves.toBe(1);
  });

  it('resolves undefined when dismissed programmatically', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.resolve(-2);

    await expect(
      showActionSheetWithOptions({
        options: [{ label: 'A' }, { label: 'Cancel', style: 'cancel' }],
      })
    ).resolves.toBeUndefined();
  });

  it('resolves the cancel index instead of rejecting', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.reject(new Error('E_NO_ACTIVITY'));

    await expect(
      showActionSheetWithOptions({
        options: [{ label: 'A' }, { label: 'Cancel', style: 'cancel' }],
      })
    ).resolves.toBe(1);
  });

  it('resolves -1 on rejection when there is no cancel button', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    mockNativeResponse = Promise.reject(new Error('E_NO_ACTIVITY'));

    await expect(
      showActionSheetWithOptions({ options: buttons('A', 'B') })
    ).resolves.toBe(-1);
  });

  it('resolves undefined on unsupported platforms', async () => {
    const { showActionSheetWithOptions } = loadIndex('web' as 'ios');

    await expect(
      showActionSheetWithOptions({ options: buttons('A') })
    ).resolves.toBeUndefined();
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
    ).resolves.toBe(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('runs nothing when -1 indexes no button', async () => {
    const { showActionSheetWithOptions } = loadIndex('android');
    const onPress = jest.fn();
    mockNativeResponse = Promise.reject(new Error('E_NO_ACTIVITY'));

    await expect(
      showActionSheetWithOptions({ options: [{ label: 'A', onPress }] })
    ).resolves.toBe(-1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
