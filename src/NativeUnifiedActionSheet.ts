import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
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
    placeholder?: string;
    defaultValue?: string;
    keyboardType?: string;
    secureTextEntry?: boolean;
    tintColor?: string;
    cancelButtonTintColor?: string;
    destructiveColor?: string;
    buttonTextAlignment?: string;
    userInterfaceStyle?: string;
  }): Promise<{ buttonIndex: number; text: string }>;
  dismissActionSheet(): void;
  dismissAllActionSheets(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('UnifiedActionSheet');
