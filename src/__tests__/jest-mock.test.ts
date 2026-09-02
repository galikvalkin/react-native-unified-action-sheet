import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type Mock = {
  setNextButtonIndex: (index?: number) => void;
  showActionSheetWithOptions: (options: {
    options: { label: string; onPress?: () => void }[];
  }) => Promise<number | undefined>;
  setNextPromptResult: (result?: { buttonIndex: number; text: string }) => void;
  showPromptWithOptions: (options: {
    options: { label: string; onPress?: (text: string) => void }[];
  }) => Promise<{ buttonIndex: number; text: string } | undefined>;
  dismissActionSheet: { (): void; mock: { calls: unknown[] } };
  dismissAllActionSheets: { (): void; mock: { calls: unknown[] } };
};

const mock = require('../../jest') as Mock;

beforeEach(() => mock.setNextButtonIndex(undefined));

describe('the shipped jest mock', () => {
  it('resolves with no selection by default', async () => {
    await expect(
      mock.showActionSheetWithOptions({ options: [{ label: 'A' }] })
    ).resolves.toBeUndefined();
  });

  it("resolves the queued index and runs that button's onPress", async () => {
    const onPress = jest.fn();
    mock.setNextButtonIndex(1);

    const index = await mock.showActionSheetWithOptions({
      options: [{ label: 'A' }, { label: 'B', onPress }],
    });

    expect(index).toBe(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies the queued index only once', async () => {
    mock.setNextButtonIndex(0);
    await mock.showActionSheetWithOptions({ options: [{ label: 'A' }] });

    await expect(
      mock.showActionSheetWithOptions({ options: [{ label: 'A' }] })
    ).resolves.toBeUndefined();
  });

  it('exposes the dismiss functions as spies', () => {
    mock.dismissActionSheet();
    mock.dismissAllActionSheets();

    expect(mock.dismissActionSheet.mock.calls.length).toBeGreaterThan(0);
    expect(mock.dismissAllActionSheets.mock.calls.length).toBeGreaterThan(0);
  });
  it('queues a prompt result and passes the text to onPress', async () => {
    const onPress = jest.fn();
    mock.setNextPromptResult({ buttonIndex: 0, text: 'typed' });

    await expect(
      mock.showPromptWithOptions({ options: [{ label: 'OK', onPress }] })
    ).resolves.toEqual({ buttonIndex: 0, text: 'typed' });
    expect(onPress).toHaveBeenCalledWith('typed');
  });

  it('resolves a prompt with no selection by default', async () => {
    await expect(
      mock.showPromptWithOptions({ options: [{ label: 'OK' }] })
    ).resolves.toBeUndefined();
  });
});
