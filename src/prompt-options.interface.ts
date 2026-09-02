import type {
  BaseAndroidOptionsInterface,
  BaseButtonInterface,
  BaseOptionsInterface,
} from './common-options.interface';

export interface PromptButtonInterface extends BaseButtonInterface {
  onPress?: (text: string) => void;
}

export interface PromptCommonOptionsInterface extends BaseOptionsInterface {
  options: PromptButtonInterface[];
  placeholder?: string;
  defaultValue?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  secureTextEntry?: boolean;
}

export type PromptAndroidOptionsInterface = BaseAndroidOptionsInterface;

export interface PromptOptionsInterface
  extends PromptCommonOptionsInterface, PromptAndroidOptionsInterface {}

export interface PromptResultInterface {
  buttonIndex: number;
  text: string;
}
