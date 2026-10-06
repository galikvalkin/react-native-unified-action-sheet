import { TurboModuleRegistry, type TurboModule } from 'react-native';

/// Buttons cross as one array of objects, in display order. style is 'cancel'
/// (at most one), 'destructive' or absent; at most one is preferred;
/// requiresText is for prompts. Results come back as an index into it.
export interface Spec extends TurboModule {
  getConstants(): {
    /// Android: whether the app opted into Material (presentationStyle
    /// 'bottom'). Always false on iOS, which needs no opt-in.
    isMaterialEnabled: boolean;
  };
  showActionSheetWithOptions(
    options: {
      buttons: {
        label: string;
        style?: string;
        disabled?: boolean;
        preferred?: boolean;
        testID?: string;
        accessibilityLabel?: string;
        accessibilityHint?: string;
        requiresText?: boolean;
      }[];
      title?: string;
      message?: string;
      tintColor?: number;
      cancelButtonTintColor?: number;
      destructiveColor?: number;
      buttonTextAlignment?: string;
      userInterfaceStyle?: string;
      cancelable?: boolean;
      presentationStyle?: string;
      anchorAlignment?: string;
      detents?: string[];
      testID?: string;
      anchorRect?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    },
    onShow: () => void
  ): Promise<number>;
  showPromptWithOptions(
    options: {
      buttons: {
        label: string;
        style?: string;
        disabled?: boolean;
        preferred?: boolean;
        testID?: string;
        accessibilityLabel?: string;
        accessibilityHint?: string;
        requiresText?: boolean;
      }[];
      title?: string;
      message?: string;
      testID?: string;
      fieldTestID?: string;
      passwordFieldTestID?: string;
      type?: string;
      placeholder?: string;
      passwordPlaceholder?: string;
      defaultValue?: string;
      keyboardType?: string;
      tintColor?: number;
      cancelButtonTintColor?: number;
      destructiveColor?: number;
      buttonTextAlignment?: string;
      userInterfaceStyle?: string;
      cancelable?: boolean;
    },
    onShow: () => void
  ): Promise<{ buttonIndex: number; text: string; password: string }>;
  dismissActionSheet(): void;
  dismissAllActionSheets(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('UnifiedActionSheet');
