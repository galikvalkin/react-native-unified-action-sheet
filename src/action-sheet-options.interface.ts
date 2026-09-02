import type {
  BaseAndroidOptionsInterface,
  BaseButtonInterface,
  BaseOptionsInterface,
} from './common-options.interface';

export interface ActionSheetButtonInterface extends BaseButtonInterface {
  onPress?: () => void;
}

export interface ActionSheetAnchorInterface {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void
  ) => void;
}

export interface ActionSheetCommonOptionsInterface extends BaseOptionsInterface {
  options: ActionSheetButtonInterface[];
  anchor?:
    | ActionSheetAnchorInterface
    | { current: ActionSheetAnchorInterface | null }
    | null;
  presentationStyle?: 'centered' | 'anchored';
}

export interface ActionSheetAndroidOptionsInterface extends BaseAndroidOptionsInterface {
  anchorAlignment?: 'start' | 'center';
}

export interface ActionSheetOptionsInterface
  extends
    ActionSheetCommonOptionsInterface,
    ActionSheetAndroidOptionsInterface {}
