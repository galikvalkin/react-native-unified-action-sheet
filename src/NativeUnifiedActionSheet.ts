import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  getConstants(): {
    /// Android: whether the app opted into Material (presentationStyle
    /// 'bottom'). Always false on iOS, which needs no opt-in.
    isMaterialEnabled: boolean;
  };
  showActionSheetWithOptions(options: {
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
    anchorRect?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }): Promise<number>;
  showPromptWithOptions(options: {
    options: string[];
    cancelButtonIndex?: number;
    destructiveButtonIndices?: number[];
    disabledButtonIndices?: number[];
    title?: string;
    message?: string;
    preferredButtonIndex?: number;
    textRequiredButtonIndices?: number[];
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
  }): Promise<{ buttonIndex: number; text: string; password: string }>;
  dismissActionSheet(): void;
  dismissAllActionSheets(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('UnifiedActionSheet');
