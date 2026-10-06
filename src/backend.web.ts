/// <reference lib="dom" />
import type { PromptReply, PromptWire, SheetWire } from './wire';
import * as sheets from './web/sheets';

/// The web backend: sheets drawn with the DOM; see web/sheets.ts. Bundlers
/// pick this file over backend.ts on web.

/// Only where there is a document: server-side rendering resolves every
/// sheet as dismissed, as an unsupported platform does.
export const isSupported = typeof document !== 'undefined';

/// The web always has its bottom sheet; there is nothing to opt into.
export const isBottomSheetAvailable = (): boolean => true;

export const showSheet = (
  options: SheetWire,
  onShow: () => void
): Promise<number> => sheets.showSheet(options, onShow);

export const showPrompt = (
  options: PromptWire,
  onShow: () => void
): Promise<PromptReply> => sheets.showPrompt(options, onShow);

export const dismissTop = (): void => sheets.dismissTop();

export const dismissAll = (): void => sheets.dismissAll();
