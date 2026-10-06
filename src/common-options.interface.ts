/// V is the type of the button's value; see value.
export interface BaseButtonInterface<V = unknown> {
  label: string;
  /// Anything that identifies this button to your code. It comes back as the
  /// result's value when this button closes the sheet, so you can branch on
  /// what was picked instead of on its index. It never reaches native code.
  value?: V;
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
  /// What screen readers say instead of the label. iOS bottom sheet and every
  /// Android style; iOS alerts, action sheets and prompts ignore it, since
  /// UIAlertAction has no public API for it.
  accessibilityLabel?: string;
  /// Extra spoken guidance after the label, e.g. what the button does. Same
  /// coverage as accessibilityLabel.
  accessibilityHint?: string;
}

export interface BaseOptionsInterface {
  title?: string;
  message?: string;
  tintColor?: string;
  cancelButtonTintColor?: string;
  destructiveColor?: string;
  userInterfaceStyle?: 'light' | 'dark';
  /// false keeps the sheet or prompt open until a button is pressed: a
  /// backdrop tap, back, a swipe down and Escape on the web do nothing.
  /// Defaults to true, as in React Native's Alert. dismissActionSheet() still
  /// closes it. iOS's standard action sheet is the exception: UIKit reports a
  /// tap outside as a tap on its cancel button, so leave the cancel button out
  /// to require a choice there.
  cancelable?: boolean;
  /// Called once the sheet or prompt is on screen: on iOS after its
  /// presentation animation, on Android when its window is shown. Called at
  /// most once, before the promise resolves, and not at all if it never
  /// appears (nothing to present from, or an unsupported platform).
  onShow?: () => void;
  /// Identifies the sheet or prompt itself in end-to-end tests, e.g. to wait
  /// for it to appear. iOS: the alert's or sheet's view accessibilityIdentifier;
  /// Android: the dialog content's tag and resource id.
  testID?: string;
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
