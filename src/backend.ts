import { Platform } from 'react-native';

import type { Spec } from './NativeUnifiedActionSheet';
import type { PromptReply, PromptWire, SheetWire } from './wire';

/// Where sheets are drawn. index.tsx speaks only to this module; bundlers pick
/// backend.web.ts on web, so native bundles never carry the DOM code and the
/// web never loads the native module.

/// Platforms without the native module (Windows, macOS) resolve every sheet
/// as dismissed rather than throwing.
export const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/// Required lazily: TurboModuleRegistry.getEnforcing throws where the module
/// is missing, and isSupported keeps those platforms from ever getting here.
const nativeModule = (): Spec =>
  require('./NativeUnifiedActionSheet').default as Spec;

/// Android: whether the app opted into Material (presentationStyle 'bottom').
export const isBottomSheetAvailable = (): boolean =>
  nativeModule().getConstants().isMaterialEnabled;

export const showSheet = (
  options: SheetWire,
  onShow: () => void
): Promise<number> =>
  nativeModule().showActionSheetWithOptions(options, onShow);

export const showPrompt = (
  options: PromptWire,
  onShow: () => void
): Promise<PromptReply> =>
  nativeModule().showPromptWithOptions(options, onShow);

export const dismissTop = (): void => nativeModule().dismissActionSheet();

export const dismissAll = (): void => nativeModule().dismissAllActionSheets();
