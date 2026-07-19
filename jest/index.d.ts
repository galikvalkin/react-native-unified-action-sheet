import type { ActionSheetOptionsInterface } from 'react-native-unified-action-sheet';

/// Queues the index the next sheet resolves with. Pass nothing to go back to
/// resolving with no selection.
export declare function setNextButtonIndex(index?: number): void;

export declare const showActionSheetWithOptions: jest.Mock<
  Promise<number | undefined>,
  [ActionSheetOptionsInterface]
>;
export declare const dismissActionSheet: jest.Mock<void, []>;
export declare const dismissAllActionSheets: jest.Mock<void, []>;
