/// One prompt button. Mirrors ActionSheetButtonInterface, except onPress
/// receives the text that was in the field when the button resolved the prompt
/// — the whole point of a prompt is the value, so handlers should not have to
/// reach for it separately.
export interface PromptButtonInterface {
  label: string;
  style?: 'cancel' | 'destructive';
  disabled?: boolean;
  onPress?: (text: string) => void;
}

export interface PromptCommonOptionsInterface {
  options: PromptButtonInterface[];
  title?: string;
  message?: string;
  /// Hint shown while the field is empty.
  placeholder?: string;
  /// Text the field starts with, already selected on iOS.
  defaultValue?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  /// Masks input, for passwords and the like.
  secureTextEntry?: boolean;
  tintColor?: string;
  cancelButtonTintColor?: string;
  destructiveColor?: string;
  userInterfaceStyle?: 'light' | 'dark';
}

export interface PromptAndroidOptionsInterface {
  buttonTextAlignment?: 'start' | 'center';
}

export interface PromptOptionsInterface
  extends PromptCommonOptionsInterface, PromptAndroidOptionsInterface {}

/// What the prompt resolves with. `text` is the field's content at the moment
/// the prompt closed, including when it was dismissed rather than confirmed.
export interface PromptResultInterface {
  buttonIndex: number;
  text: string;
}
