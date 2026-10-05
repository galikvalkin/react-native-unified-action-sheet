import type {
  BaseAndroidOptionsInterface,
  BaseButtonInterface,
  BaseOptionsInterface,
  CloseResultInterface,
} from './common-options.interface';

/// What was in the field(s) when the prompt closed. password is present only
/// for type 'login-password'.
export interface PromptValuesInterface {
  text: string;
  password?: string;
}

export interface PromptButtonInterface<
  V = unknown,
> extends BaseButtonInterface<V> {
  onPress?: (values: PromptValuesInterface) => void;
  /// Keeps this button disabled while the field is empty (for
  /// 'login-password', while either field is).
  requiresText?: boolean;
}

export interface PromptCommonOptionsInterface<
  V = unknown,
> extends BaseOptionsInterface {
  options: PromptButtonInterface<V>[];
  /// As in React Native's Alert.prompt. 'login-password' shows a second,
  /// secure field below the first. Defaults to 'plain-text'.
  type?: 'plain-text' | 'secure-text' | 'login-password';
  placeholder?: string;
  /// Placeholder of the password field of a 'login-password' prompt.
  passwordPlaceholder?: string;
  defaultValue?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  /// Same as type: 'secure-text'. Kept for compatibility; type wins when both
  /// are set.
  secureTextEntry?: boolean;
  /// Identifies the (first) text field in end-to-end tests, e.g. to type into
  /// it. iOS: its accessibilityIdentifier; Android: its tag and resource id.
  fieldTestID?: string;
  /// Same as fieldTestID, for the password field of a 'login-password' prompt.
  passwordFieldTestID?: string;
}

export type PromptAndroidOptionsInterface = BaseAndroidOptionsInterface;

export interface PromptOptionsInterface<V = unknown>
  extends PromptCommonOptionsInterface<V>, PromptAndroidOptionsInterface {}

/// value works as for sheets: the value of the button that closed the prompt.
export type PromptResultInterface<V = unknown> = CloseResultInterface &
  PromptValuesInterface & { value?: V };
