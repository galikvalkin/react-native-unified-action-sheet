import type {
  ActionSheetOptionsInterface,
  ActionSheetResultInterface,
  PromptOptionsInterface,
  PromptResultInterface,
} from 'react-native-unified-action-sheet';

/// Queues the index the next sheet resolves with; the reason is derived as the
/// real module would. Pass nothing to go back to resolving as dismissed.
export declare function setNextButtonIndex(index?: number): void;

/// Typed as the real function, generic over the buttons' values; jest.Mock
/// itself cannot be generic, so the mock helpers come from the intersection.
export declare const showActionSheetWithOptions: (<V = unknown>(
  options: ActionSheetOptionsInterface<V>
) => Promise<ActionSheetResultInterface<V>>) &
  jest.Mock<Promise<ActionSheetResultInterface>, [ActionSheetOptionsInterface]>;
/// Queues what the next prompt resolves with; the reason is derived as the
/// real module would. Pass nothing to go back to resolving as dismissed.
export declare function setNextPromptResult(result?: {
  buttonIndex: number;
  text: string;
  password?: string;
}): void;

export declare const showPromptWithOptions: (<V = unknown>(
  options: PromptOptionsInterface<V>
) => Promise<PromptResultInterface<V>>) &
  jest.Mock<Promise<PromptResultInterface>, [PromptOptionsInterface]>;
export declare const dismissActionSheet: jest.Mock<void, []>;
export declare const dismissAllActionSheets: jest.Mock<void, []>;
