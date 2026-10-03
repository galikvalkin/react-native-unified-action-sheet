import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  getConstants(): {
    /// Android: whether the app opted into Material (presentationStyle
    /// 'bottom'). Always false on iOS, which needs no opt-in.
    isMaterialEnabled: boolean;
  };
  showActionSheetWithOptions(
    options: {
      options: string[];
      cancelButtonIndex?: number;
      destructiveButtonIndices?: number[];
      title?: string;
      message?: string;
      tintColor?: string;
      cancelButtonTintColor?: string;
      destructiveColor?: string;
      buttonTextAlignment?: string;
      disabledButtonIndices?: number[];
      userInterfaceStyle?: string;
      presentationStyle?: string;
      anchorAlignment?: string;
      preferredButtonIndex?: number;
      detents?: string[];
      testIDs?: string[];
      accessibilityLabels?: string[];
      accessibilityHints?: string[];
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
      options: string[];
      cancelButtonIndex?: number;
      destructiveButtonIndices?: number[];
      disabledButtonIndices?: number[];
      title?: string;
      message?: string;
      preferredButtonIndex?: number;
      textRequiredButtonIndices?: number[];
      testIDs?: string[];
      accessibilityLabels?: string[];
      accessibilityHints?: string[];
      testID?: string;
      fieldTestID?: string;
      passwordFieldTestID?: string;
      type?: string;
      placeholder?: string;
      passwordPlaceholder?: string;
      defaultValue?: string;
      keyboardType?: string;
      tintColor?: string;
      cancelButtonTintColor?: string;
      destructiveColor?: string;
      buttonTextAlignment?: string;
      userInterfaceStyle?: string;
    },
    onShow: () => void
  ): Promise<{ buttonIndex: number; text: string; password: string }>;
  dismissActionSheet(): void;
  dismissAllActionSheets(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('UnifiedActionSheet');
