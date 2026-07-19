/// One button. `style` mirrors React Native's own Alert API and the native
/// button roles, which are mutually exclusive; `disabled` is independent of it.
export interface ActionSheetButtonInterface {
  label: string;
  style?: 'cancel' | 'destructive';
  disabled?: boolean;
  /// Runs when this button resolves the sheet, so callers need not match on the
  /// index. A dismissal that resolves the cancel button counts as pressing it.
  onPress?: () => void;
}

/// Anything measurable — every React Native host component ref has this method,
/// so a `useRef` on a View, Pressable or Touchable satisfies it.
export interface ActionSheetAnchorInterface {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void
  ) => void;
}

export interface ActionSheetCommonOptionsInterface {
  options: ActionSheetButtonInterface[];
  title?: string;
  message?: string;
  tintColor?: string;
  cancelButtonTintColor?: string;
  userInterfaceStyle?: 'light' | 'dark';
  anchor?:
    | ActionSheetAnchorInterface
    | { current: ActionSheetAnchorInterface | null }
    | null;
  destructiveColor?: string;
  presentationStyle?: 'centered' | 'anchored';
}

export interface ActionSheetAndroidOptionsInterface {
  buttonTextAlignment?: 'start' | 'center';
  anchorAlignment?: 'start' | 'center';
}

export interface ActionSheetOptionsInterface
  extends
    ActionSheetCommonOptionsInterface,
    ActionSheetAndroidOptionsInterface {}
