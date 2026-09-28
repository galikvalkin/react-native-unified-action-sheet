import type {
  ActionSheetOptionsInterface,
  ActionSheetResultInterface,
  PromptOptionsInterface,
  PromptResultInterface,
} from 'react-native-unified-action-sheet';

/// Queues the index the next sheet resolves with; the reason is derived as the
/// real module would. Pass nothing to go back to resolving as dismissed.
export declare function setNextButtonIndex(index?: number): void;

export declare const showActionSheetWithOptions: jest.Mock<
  Promise<ActionSheetResultInterface>,
  [ActionSheetOptionsInterface]
>;
/// Queues what the next prompt resolves with; the reason is derived as the
/// real module would. Pass nothing to go back to resolving as dismissed.
export declare function setNextPromptResult(result?: {
  buttonIndex: number;
  text: string;
  password?: string;
}): void;

export declare const showPromptWithOptions: jest.Mock<
  Promise<PromptResultInterface>,
  [PromptOptionsInterface]
>;
export declare const dismissActionSheet: jest.Mock<void, []>;
export declare const dismissAllActionSheets: jest.Mock<void, []>;
