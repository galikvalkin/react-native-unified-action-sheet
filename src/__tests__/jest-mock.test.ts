import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type Mock = {
  setNextButtonIndex: (index?: number) => void;
  showActionSheetWithOptions: (options: {
    options: { label: string; onPress?: () => void }[];
  }) => Promise<number | undefined>;
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
});
