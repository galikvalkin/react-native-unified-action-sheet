import type {
  BaseAndroidOptionsInterface,
  BaseButtonInterface,
  BaseOptionsInterface,
  CloseResultInterface,
} from './common-options.interface';

export interface ActionSheetButtonInterface extends BaseButtonInterface {
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

export interface ActionSheetCommonOptionsInterface extends BaseOptionsInterface {
  options: ActionSheetButtonInterface[];
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

export interface ActionSheetOptionsInterface
  extends
    ActionSheetCommonOptionsInterface,
    ActionSheetAndroidOptionsInterface {}

export type ActionSheetResultInterface = CloseResultInterface;
