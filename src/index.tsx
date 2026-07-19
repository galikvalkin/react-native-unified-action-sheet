import { Platform } from 'react-native';

import type { Spec } from './NativeUnifiedActionSheet';
import type { ActionSheetOptionsInterface } from './action-sheet-options.interface';

export type {
  ActionSheetAnchorInterface,
  ActionSheetButtonInterface,
  ActionSheetCommonOptionsInterface,
  ActionSheetAndroidOptionsInterface,
  ActionSheetOptionsInterface,
} from './action-sheet-options.interface';

const DISMISSED_BY_API = -2;

/// The native wire format is index-based; the public API is not. Nothing below
/// index.tsx knows buttons are described as objects.
type WireOptions = Omit<ActionSheetOptionsInterface, 'options' | 'anchor'> & {
  options: string[];
  cancelButtonIndex?: number;
  destructiveButtonIndices?: number[];
  disabledButtonIndices?: number[];
  anchorRect?: { x: number; y: number; width: number; height: number };
};

const nativeModule = (): Spec =>
  require('./NativeUnifiedActionSheet').default as Spec;

/// Flattens the buttons into the labels and index sets the native side expects.
/// Only the first button styled 'cancel' counts, since there is one cancel row.
const toWireOptions = ({
  options,
  // Dropped deliberately: the anchor is a ref, and only its measured rect
  // crosses the bridge. Omit<> would not strip it at runtime.
  anchor: _anchor,
  ...rest
}: ActionSheetOptionsInterface): WireOptions => {
  const labels: string[] = [];
  const destructive: number[] = [];
  const disabled: number[] = [];
  let cancelButtonIndex: number | undefined;

  options.forEach((button, index) => {
    labels.push(button.label);

    if (button.style === 'destructive') destructive.push(index);
    if (button.style === 'cancel' && cancelButtonIndex == null) {
      cancelButtonIndex = index;
    }
    if (button.disabled) disabled.push(index);
  });

  return {
    ...rest,
    options: labels,
    ...(cancelButtonIndex == null ? {} : { cancelButtonIndex }),
    ...(destructive.length === 0
      ? {}
      : { destructiveButtonIndices: destructive }),
    ...(disabled.length === 0 ? {} : { disabledButtonIndices: disabled }),
  };
};

const showWithNativeModule = (
  options: WireOptions
): Promise<number | undefined> =>
  nativeModule()
    .showActionSheetWithOptions(options)
    // A programmatic dismiss resolves with no index rather than a selection.
    .then((buttonIndex) =>
      buttonIndex === DISMISSED_BY_API ? undefined : buttonIndex
    )
    .catch(() => options.cancelButtonIndex ?? -1);

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
    target.measureInWindow((x, y, width, height) => {
      const measured = typeof x === 'number' && typeof y === 'number';

      resolve(
        measured ? { ...wire, anchorRect: { x, y, width, height } } : wire
      );
    });
  });
};

export const showActionSheetWithOptions = (
  options: ActionSheetOptionsInterface
): Promise<number | undefined> => {
  const wire = toWireOptions(options);

  // -1 and undefined index nothing, so optional chaining covers both.
  const press = (buttonIndex: number | undefined) => {
    if (buttonIndex != null) options.options[buttonIndex]?.onPress?.();

    return buttonIndex;
  };

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return Promise.resolve(undefined);
  }

  return withAnchorRect(wire, options.anchor)
    .then(showWithNativeModule)
    .then(press);
};

export const dismissActionSheet = (): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    nativeModule().dismissActionSheet();
  }
};

/// Closes every open sheet, not just the top-most one. Each resolves with no
/// index, exactly as dismissActionSheet() does.
export const dismissAllActionSheets = (): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    nativeModule().dismissAllActionSheets();
  }
};
