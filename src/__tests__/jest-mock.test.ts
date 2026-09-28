import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type Mock = {
  setNextButtonIndex: (index?: number) => void;
  showActionSheetWithOptions: (options: {
    options: { label: string; style?: string; onPress?: () => void }[];
  }) => Promise<{ reason: string; buttonIndex: number | undefined }>;
  setNextPromptResult: (result?: {
    buttonIndex: number;
    text: string;
    password?: string;
  }) => void;
  showPromptWithOptions: (options: {
    options: {
      label: string;
      style?: string;
      onPress?: (values: { text: string; password?: string }) => void;
    }[];
  }) => Promise<{
    reason: string;
    buttonIndex: number | undefined;
    text: string;
    password?: string;
  }>;
  dismissActionSheet: { (): void; mock: { calls: unknown[] } };
  dismissAllActionSheets: { (): void; mock: { calls: unknown[] } };
};

const mock = require('../../jest') as Mock;

beforeEach(() => mock.setNextButtonIndex(undefined));

describe('the shipped jest mock', () => {
  it('resolves as dismissed by default', async () => {
    await expect(
      mock.showActionSheetWithOptions({ options: [{ label: 'A' }] })
    ).resolves.toEqual({ reason: 'dismissed', buttonIndex: undefined });
  });

  it("resolves the queued index and runs that button's onPress", async () => {
    const onPress = jest.fn();
    mock.setNextButtonIndex(1);

    const result = await mock.showActionSheetWithOptions({
      options: [{ label: 'A' }, { label: 'B', onPress }],
    });

    expect(result).toEqual({ reason: 'selected', buttonIndex: 1 });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('derives cancelled for the cancel button, like the real module', async () => {
    mock.setNextButtonIndex(1);

    await expect(
      mock.showActionSheetWithOptions({
        options: [{ label: 'A' }, { label: 'Cancel', style: 'cancel' }],
      })
    ).resolves.toEqual({ reason: 'cancelled', buttonIndex: 1 });
  });

  it('applies the queued index only once', async () => {
    mock.setNextButtonIndex(0);
    await mock.showActionSheetWithOptions({ options: [{ label: 'A' }] });

    await expect(
      mock.showActionSheetWithOptions({ options: [{ label: 'A' }] })
    ).resolves.toEqual({ reason: 'dismissed', buttonIndex: undefined });
  });

  it('exposes the dismiss functions as spies', () => {
    mock.dismissActionSheet();
    mock.dismissAllActionSheets();

    expect(mock.dismissActionSheet.mock.calls.length).toBeGreaterThan(0);
    expect(mock.dismissAllActionSheets.mock.calls.length).toBeGreaterThan(0);
  });
  it('queues a prompt result and passes the values to onPress', async () => {
    const onPress = jest.fn();
    mock.setNextPromptResult({ buttonIndex: 0, text: 'typed' });

    await expect(
      mock.showPromptWithOptions({ options: [{ label: 'OK', onPress }] })
    ).resolves.toEqual({ reason: 'selected', buttonIndex: 0, text: 'typed' });
    expect(onPress).toHaveBeenCalledWith({ text: 'typed' });
  });

  it('carries a queued password through', async () => {
    const onPress = jest.fn();
    mock.setNextPromptResult({ buttonIndex: 0, text: 'ann', password: 'pw' });

    await expect(
      mock.showPromptWithOptions({ options: [{ label: 'Sign in', onPress }] })
    ).resolves.toEqual({
      reason: 'selected',
      buttonIndex: 0,
      text: 'ann',
      password: 'pw',
    });
    expect(onPress).toHaveBeenCalledWith({ text: 'ann', password: 'pw' });
  });

  it('resolves a prompt as dismissed by default', async () => {
    await expect(
      mock.showPromptWithOptions({ options: [{ label: 'OK' }] })
    ).resolves.toEqual({
      reason: 'dismissed',
      buttonIndex: undefined,
      text: '',
    });
  });
});
