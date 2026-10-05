import type {
  BaseAndroidOptionsInterface,
  BaseButtonInterface,
  BaseOptionsInterface,
  CloseResultInterface,
} from './common-options.interface';

export interface ActionSheetButtonInterface<
  V = unknown,
> extends BaseButtonInterface<V> {
  onPress?: () => void;
}

export interface ActionSheetAnchorInterface {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void
  ) => void;
}

/// A bottom sheet's height: 'auto' fits the content, 'medium' is half the
/// screen, 'large' is the full height below the status bar.
export type ActionSheetDetent = 'auto' | 'medium' | 'large';

export interface ActionSheetCommonOptionsInterface<
  V = unknown,
> extends BaseOptionsInterface {
  options: ActionSheetButtonInterface<V>[];
  anchor?:
    | ActionSheetAnchorInterface
    | { current: ActionSheetAnchorInterface | null }
    | null;
  presentationStyle?: 'centered' | 'anchored' | 'bottom';
  /// 'bottom' only: the heights the sheet can rest at. It opens at the first
  /// and can be dragged to the others. Unset, a short list fits its content
  /// and a long one opens at half height and expands to full.
  detents?: ActionSheetDetent[];
}

export interface ActionSheetAndroidOptionsInterface extends BaseAndroidOptionsInterface {
  anchorAlignment?: 'start' | 'center';
}

export interface ActionSheetOptionsInterface<V = unknown>
  extends
    ActionSheetCommonOptionsInterface<V>,
    ActionSheetAndroidOptionsInterface {}

/// value is the value of the button that closed the sheet: the one picked,
/// or the cancel button on a cancellation. Absent when that button has none,
/// on a dismissal, and on a cancellation without a cancel button.
export type ActionSheetResultInterface<V = unknown> = CloseResultInterface & {
  value?: V;
};
