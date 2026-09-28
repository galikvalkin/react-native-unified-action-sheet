export interface BaseButtonInterface {
  label: string;
  style?: 'cancel' | 'destructive';
  disabled?: boolean;
  /// The default action: bold on Android and in iOS alerts, prompts and bottom
  /// sheets. Only the first preferred button counts. UIKit ignores it in the
  /// standard iOS action sheet, where the cancel button is already bold.
  preferred?: boolean;
}

export interface BaseOptionsInterface {
  title?: string;
  message?: string;
  tintColor?: string;
  cancelButtonTintColor?: string;
  destructiveColor?: string;
  userInterfaceStyle?: 'light' | 'dark';
}

export interface BaseAndroidOptionsInterface {
  buttonTextAlignment?: 'start' | 'center';
}

/// Why a sheet or prompt closed.
///  - 'selected': a button other than the cancel button.
///  - 'cancelled': the cancel button, a backdrop tap, back, or a swipe down.
///  - 'dismissed': dismissActionSheet(), dismissAllActionSheets(), or a JS
///    reload; also on a platform without the native module.
export type CloseReason = 'selected' | 'cancelled' | 'dismissed';

/// buttonIndex is the button that closed it. A cancellation carries the cancel
/// button's index, or -1 when there is none; a dismissal carries no index.
export type CloseResultInterface =
  | { reason: 'selected' | 'cancelled'; buttonIndex: number }
  | { reason: 'dismissed'; buttonIndex: undefined };
