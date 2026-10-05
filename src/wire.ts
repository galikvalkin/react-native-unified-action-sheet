import type { Spec } from './NativeUnifiedActionSheet';

/// What crosses from index.tsx to a backend, native or web: the codegen
/// spec's argument and result types, so both backends see exactly one shape.
export type SheetWire = Parameters<Spec['showActionSheetWithOptions']>[0];
export type PromptWire = Parameters<Spec['showPromptWithOptions']>[0];
export type PromptReply = Awaited<ReturnType<Spec['showPromptWithOptions']>>;
export type WireButton = SheetWire['buttons'][number];

/// What a backend resolves when dismissActionSheet() or a reload closes a
/// sheet; index.tsx maps it to reason 'dismissed'.
export const DISMISSED_BY_API = -2;
