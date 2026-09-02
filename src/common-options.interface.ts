export interface BaseButtonInterface {
  label: string;
  style?: 'cancel' | 'destructive';
  disabled?: boolean;
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
