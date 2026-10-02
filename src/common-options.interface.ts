export interface BaseButtonInterface {
  label: string;
  style?: 'cancel' | 'destructive';
  disabled?: boolean;
  /// The default action, emphasized: bold on Android and in the iOS bottom
  /// sheet; in iOS alerts and prompts UIKit's own preferred-action style (a
  /// filled button from iOS 26, bold text before). Only the first preferred
  /// button counts. UIKit ignores it in the standard iOS action sheet.
  preferred?: boolean;
  /// Identifies this button in end-to-end tests (Detox, Maestro, Appium,
  /// XCUITest, UiAutomator). Not shown or spoken. iOS: the action's or row's
  /// accessibilityIdentifier; Android: the row's tag and resource id.
  testID?: string;
}

export interface BaseOptionsInterface {
  title?: string;
  message?: string;
  tintColor?: string;
  cancelButtonTintColor?: string;
  destructiveColor?: string;
  userInterfaceStyle?: 'light' | 'dark';
  /// Called once the sheet or prompt is on screen: on iOS after its
  /// presentation animation, on Android when its window is shown. Called at
  /// most once, before the promise resolves, and not at all if it never
  /// appears (nothing to present from, or an unsupported platform).
  onShow?: () => void;
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
