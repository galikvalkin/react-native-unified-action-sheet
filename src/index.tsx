import { Platform, processColor } from 'react-native';

import type { Spec } from './NativeUnifiedActionSheet';
import type {
  ActionSheetOptionsInterface,
  ActionSheetResultInterface,
} from './action-sheet-options.interface';
import type {
  BaseButtonInterface,
  CloseResultInterface,
} from './common-options.interface';
import type {
  PromptOptionsInterface,
  PromptResultInterface,
} from './prompt-options.interface';

export type {
  BaseButtonInterface,
  BaseOptionsInterface,
  BaseAndroidOptionsInterface,
  CloseReason,
  CloseResultInterface,
} from './common-options.interface';

export type {
  PromptButtonInterface,
  PromptCommonOptionsInterface,
  PromptAndroidOptionsInterface,
  PromptOptionsInterface,
  PromptResultInterface,
  PromptValuesInterface,
} from './prompt-options.interface';

export type {
  ActionSheetAnchorInterface,
  ActionSheetButtonInterface,
  ActionSheetCommonOptionsInterface,
  ActionSheetAndroidOptionsInterface,
  ActionSheetDetent,
  ActionSheetOptionsInterface,
  ActionSheetResultInterface,
} from './action-sheet-options.interface';

const DISMISSED_BY_API = -2;

/// One button as it crosses the bridge: the public shape minus onPress, with
/// the "only the first counts" rules for cancel and preferred already applied,
/// so neither native side has to repeat them. Results still come back as an
/// index into this array.
type WireButton = {
  label: string;
  style?: 'cancel' | 'destructive';
  disabled?: boolean;
  preferred?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /// Prompts only.
  requiresText?: boolean;
};

type WireButtons = { buttons: WireButton[] };

/// Colors cross as React Native's processed ARGB numbers, not strings.
type WireColors = {
  tintColor?: number;
  cancelButtonTintColor?: number;
  destructiveColor?: number;
};

type ColorKey = keyof WireColors;

type WireOptions = Omit<
  ActionSheetOptionsInterface,
  'options' | 'anchor' | 'onShow' | ColorKey
> &
  WireButtons &
  WireColors & {
    anchorRect?: { x: number; y: number; width: number; height: number };
  };

/// Parses colors the way React Native does everywhere else, so '#RRGGBBAA',
/// '#RGB', 'rgba(...)' and named colors mean the same on both platforms.
/// processColor yields an ARGB number; anything it can't parse is dropped.
const toWireColors = (colors: {
  tintColor?: string;
  cancelButtonTintColor?: string;
  destructiveColor?: string;
}): WireColors => {
  const wire: WireColors = {};
  for (const key of [
    'tintColor',
    'cancelButtonTintColor',
    'destructiveColor',
  ] as const) {
    const processed = colors[key] == null ? null : processColor(colors[key]);
    if (typeof processed === 'number') wire[key] = processed;
  }

  return wire;
};

const nativeModule = (): Spec =>
  require('./NativeUnifiedActionSheet').default as Spec;

const toWireOptions = ({
  options,
  // Dropped deliberately: the anchor is a ref, and only its measured rect
  // crosses the bridge. Omit<> would not strip it at runtime.
  anchor: _anchor,
  // A function: it travels as the native method's callback argument instead.
  onShow: _onShow,
  tintColor,
  cancelButtonTintColor,
  destructiveColor,
  ...rest
}: ActionSheetOptionsInterface): WireOptions => ({
  ...rest,
  ...toWireButtons(options),
  ...toWireColors({ tintColor, cancelButtonTintColor, destructiveColor }),
});

type WirePromptOptions = Omit<
  PromptOptionsInterface,
  'options' | 'secureTextEntry' | 'onShow' | ColorKey
> &
  WireButtons &
  WireColors & {
    type: NonNullable<PromptOptionsInterface['type']>;
  };

/// Shared by sheets and prompts, so the two cannot disagree about what
/// 'cancel' means. Only the first button styled 'cancel' counts, since there is
/// one cancel row; only the first preferred one does too. Unset fields are
/// left off rather than sent as undefined.
const toWireButtons = (
  buttons: ReadonlyArray<BaseButtonInterface & { requiresText?: boolean }>
): WireButtons => {
  let hasCancel = false;
  let hasPreferred = false;

  return {
    buttons: buttons.map((button) => {
      const isCancel = button.style === 'cancel' && !hasCancel;
      const isPreferred = Boolean(button.preferred) && !hasPreferred;
      hasCancel ||= isCancel;
      hasPreferred ||= isPreferred;

      const style =
        button.style === 'destructive'
          ? 'destructive'
          : isCancel
            ? 'cancel'
            : undefined;

      return {
        label: button.label,
        ...(style ? { style } : {}),
        ...(button.disabled ? { disabled: true } : {}),
        ...(isPreferred ? { preferred: true } : {}),
        ...(button.testID ? { testID: button.testID } : {}),
        ...(button.accessibilityLabel
          ? { accessibilityLabel: button.accessibilityLabel }
          : {}),
        ...(button.accessibilityHint
          ? { accessibilityHint: button.accessibilityHint }
          : {}),
        ...(button.requiresText ? { requiresText: true } : {}),
      };
    }),
  };
};

/// The cancel row's index in the wire buttons, if there is one.
const cancelIndexOf = ({ buttons }: WireButtons): number | undefined => {
  const index = buttons.findIndex((button) => button.style === 'cancel');

  return index < 0 ? undefined : index;
};

/// Native sides only report an index: DISMISSED_BY_API, the cancel button's
/// index, -1 (a cancel gesture with no cancel button), or another button.
const toCloseResult = (
  buttonIndex: number,
  cancelButtonIndex: number | undefined
): CloseResultInterface => {
  if (buttonIndex === DISMISSED_BY_API) {
    return { reason: 'dismissed', buttonIndex: undefined };
  }
  if (buttonIndex < 0 || buttonIndex === cancelButtonIndex) {
    return { reason: 'cancelled', buttonIndex };
  }

  return { reason: 'selected', buttonIndex };
};

const DISMISSED: CloseResultInterface = {
  reason: 'dismissed',
  buttonIndex: undefined,
};

const showWithNativeModule = (
  options: WireOptions,
  onShow: () => void
): Promise<ActionSheetResultInterface> => {
  const cancelButtonIndex = cancelIndexOf(options);

  return (
    nativeModule()
      .showActionSheetWithOptions(options, onShow)
      // A native failure reads as a cancellation rather than a rejection.
      .catch(() => cancelButtonIndex ?? -1)
      .then((buttonIndex) => toCloseResult(buttonIndex, cancelButtonIndex))
  );
};

let warnedMaterialDisabled = false;

/// 'bottom' needs Material on Android, which the app opts into at build time.
/// Without it the sheet falls back to a centered dialog; say so once, in
/// development, since the fallback alone looks like the option was ignored.
const warnIfBottomUnavailable = (
  presentationStyle: ActionSheetOptionsInterface['presentationStyle']
) => {
  if (
    !__DEV__ ||
    warnedMaterialDisabled ||
    Platform.OS !== 'android' ||
    presentationStyle !== 'bottom' ||
    nativeModule().getConstants().isMaterialEnabled
  ) {
    return;
  }

  warnedMaterialDisabled = true;
  console.warn(
    "react-native-unified-action-sheet: presentationStyle 'bottom' needs Material on Android, " +
      'so this sheet falls back to a centered dialog. Set unifiedActionSheet.material=true in ' +
      "android/gradle.properties, or add ['react-native-unified-action-sheet', { material: true }] " +
      'to your Expo plugins, then rebuild the app.'
  );
};

/// How long to wait for an anchor's measurement before presenting without it.
/// A mounted view answers within a frame; one that has unmounted may never.
const ANCHOR_TIMEOUT_MS = 500;

/// The anchor is measured in JS and sent across as a rect, so neither native
/// module has to resolve a view: a ref's own measureInWindow is the supported
/// way to do this on both architectures, unlike a react tag.
const withAnchorRect = (
  wire: WireOptions,
  anchor: ActionSheetOptionsInterface['anchor']
): Promise<WireOptions> => {
  const target =
    anchor && 'measureInWindow' in anchor ? anchor : (anchor?.current ?? null);

  if (!target) return Promise.resolve(wire);

  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: WireOptions) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    // A view that unmounted may never answer: present unanchored instead of
    // hanging, and ignore a measurement that arrives afterwards.
    const timer = setTimeout(() => settle(wire), ANCHOR_TIMEOUT_MS);

    target.measureInWindow((x, y, width, height) => {
      const measured = typeof x === 'number' && typeof y === 'number';

      settle(
        measured ? { ...wire, anchorRect: { x, y, width, height } } : wire
      );
    });
  });
};

export const showActionSheetWithOptions = (
  options: ActionSheetOptionsInterface
): Promise<ActionSheetResultInterface> => {
  const wire = toWireOptions(options);

  // -1 and a dismissal index nothing, so optional chaining covers both.
  const press = (result: ActionSheetResultInterface) => {
    if (result.buttonIndex != null) {
      options.options[result.buttonIndex]?.onPress?.();
    }

    return result;
  };

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return Promise.resolve(DISMISSED);
  }

  warnIfBottomUnavailable(options.presentationStyle);

  // A bottom sheet has no anchor, so don't measure one: on iPad a rect would
  // turn the sheet into an arrowed popover pointing at it.
  const anchor =
    options.presentationStyle === 'bottom' ? undefined : options.anchor;

  // Always a function: the native signature takes a callback, which it calls
  // at most once, when the sheet is on screen.
  const onShow = () => options.onShow?.();

  return withAnchorRect(wire, anchor)
    .then((withRect) => showWithNativeModule(withRect, onShow))
    .then(press);
};

export const dismissActionSheet = (): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    nativeModule().dismissActionSheet();
  }
};

/// Closes every open sheet, not just the top-most one. Each resolves as
/// 'dismissed', exactly as with dismissActionSheet().
export const dismissAllActionSheets = (): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    nativeModule().dismissAllActionSheets();
  }
};

/// A prompt is the sheet's centered dialog with a text field: iOS presents a
/// UIAlertController alert with addTextField, Android the same AppCompatDialog
/// the centered style uses. React Native's own Alert.prompt is iOS-only and a
/// silent no-op on Android, which is the gap this fills.
export const showPromptWithOptions = (
  options: PromptOptionsInterface
): Promise<PromptResultInterface> => {
  const {
    options: buttons,
    secureTextEntry,
    type,
    // A function: it travels as the native method's callback argument.
    onShow,
    tintColor,
    cancelButtonTintColor,
    destructiveColor,
    ...rest
  } = options;
  const wire: WirePromptOptions = {
    ...rest,
    ...toWireButtons(buttons),
    ...toWireColors({ tintColor, cancelButtonTintColor, destructiveColor }),
    // One field of truth for the native sides: the old boolean maps onto type.
    type: type ?? (secureTextEntry ? 'secure-text' : 'plain-text'),
  };
  const cancelButtonIndex = cancelIndexOf(wire);
  const hasPassword = wire.type === 'login-password';

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return Promise.resolve({ ...DISMISSED, text: '' });
  }

  return nativeModule()
    .showPromptWithOptions(wire, () => onShow?.())
    .catch(() => ({
      buttonIndex: cancelButtonIndex ?? -1,
      text: '',
      password: '',
    }))
    .then(({ buttonIndex, text, password }): PromptResultInterface => ({
      ...toCloseResult(buttonIndex, cancelButtonIndex),
      text,
      // Even a dismissal carries the fields, so a draft is recoverable.
      ...(hasPassword ? { password } : {}),
    }))
    .then((result) => {
      // The values go to the handler, so a caller using onPress alone never
      // has to read the resolved value.
      if (result.buttonIndex != null) {
        const { text, password } = result;
        buttons[result.buttonIndex]?.onPress?.(
          hasPassword ? { text, password } : { text }
        );
      }

      return result;
    });
};
