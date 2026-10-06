/**
 * @jest-environment jsdom
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import * as sheets from '../web/sheets';
import { TRANSITION_MS } from '../web/styles';
import type { PromptWire, SheetWire } from '../wire';

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  // React Native Web's processColor: ARGB numbers, null when unparseable.
  processColor: (color: unknown) => (color === '#FF000080' ? 0x80ff0000 : null),
}));
// What a web bundler does: backend.web.ts in place of backend.ts.
jest.mock('../backend', () => jest.requireActual('../backend.web'));

const sheet = (overrides: Partial<SheetWire> = {}): SheetWire => ({
  buttons: [
    { label: 'Share' },
    { label: 'Delete', style: 'destructive' },
    { label: 'Cancel', style: 'cancel' },
  ],
  ...overrides,
});

const panel = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const panels = () => document.querySelectorAll('[role="dialog"]');
const row = (label: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('.uas-row')).find(
    (node) => node.textContent === label
  )!;
const key = (name: string, init: KeyboardEventInit = {}) =>
  document.activeElement!.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, ...init })
  );

beforeEach(() => {
  jest.useFakeTimers();
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
});

afterEach(() => {
  sheets.dismissAll();
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  document.body.innerHTML = '';
});

describe('web sheets', () => {
  it('renders an accessible dialog: header, rows in order, cancel last', () => {
    sheets.showSheet(sheet({ title: 'Item', message: 'Pick one' }), () => {});

    const dialog = panel();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(
      dialog.getAttribute('aria-labelledby')!
    );
    expect(title?.textContent).toBe('Item');
    expect(title?.getAttribute('role')).toBe('heading');
    expect(
      document.getElementById(dialog.getAttribute('aria-describedby')!)
        ?.textContent
    ).toBe('Pick one');
    expect(
      Array.from(dialog.querySelectorAll('.uas-rows > *')).map(
        (node) => node.textContent || node.className
      )
    ).toEqual(['Share', 'Delete', 'uas-spacer', 'Cancel']);
  });

  it('resolves the clicked row and removes the sheet after its transition', async () => {
    const result = sheets.showSheet(sheet(), () => {});

    row('Delete').click();

    await expect(result).resolves.toBe(1);
    expect(panels()).toHaveLength(1);
    jest.advanceTimersByTime(TRANSITION_MS);
    expect(panels()).toHaveLength(0);
  });

  it('cancels on Escape and on a backdrop click, with the cancel index', async () => {
    const escaped = sheets.showSheet(sheet(), () => {});
    key('Escape');
    await expect(escaped).resolves.toBe(2);

    const tapped = sheets.showSheet(sheet(), () => {});
    // The first sheet's overlay is still fading out: click the new one.
    Array.from(document.querySelectorAll<HTMLElement>('.uas-scrim'))
      .pop()!
      .click();
    await expect(tapped).resolves.toBe(2);
  });

  it('cancels with -1 when there is no cancel button', async () => {
    const result = sheets.showSheet(
      sheet({ buttons: [{ label: 'A' }, { label: 'B' }] }),
      () => {}
    );

    key('Escape');

    await expect(result).resolves.toBe(-1);
  });

  it('ignores a disabled row', () => {
    const onClose = jest.fn();
    sheets
      .showSheet(
        sheet({ buttons: [{ label: 'Off', disabled: true }, { label: 'On' }] }),
        () => {}
      )
      .then(onClose);

    expect(row('Off').disabled).toBe(true);
    row('Off').click();

    expect(panels()).toHaveLength(1);
  });

  it('calls onShow once the open transition ran, or on an early close', async () => {
    const onShow = jest.fn();
    sheets.showSheet(sheet(), onShow);
    expect(onShow).not.toHaveBeenCalled();
    jest.advanceTimersByTime(TRANSITION_MS);
    expect(onShow).toHaveBeenCalledTimes(1);

    // Dismissed mid-transition: it did appear, so onShow runs, before the
    // promise resolves, and only once.
    const order: string[] = [];
    const early = sheets
      .showSheet(sheet(), () => order.push('shown'))
      .then(() => order.push('resolved'));
    sheets.dismissTop();
    jest.advanceTimersByTime(TRANSITION_MS);
    await early;
    expect(order).toEqual(['shown', 'resolved']);
  });

  it('maps testIDs, accessibility labels and hints, and the preferred row', () => {
    sheets.showSheet(
      sheet({
        testID: 'the-sheet',
        buttons: [
          {
            label: '🗑',
            testID: 'delete',
            accessibilityLabel: 'Delete',
            accessibilityHint: 'Removes the item',
            preferred: true,
          },
        ],
      }),
      () => {}
    );

    expect(panel().getAttribute('data-testid')).toBe('the-sheet');
    const node = document.querySelector<HTMLElement>('[data-testid="delete"]')!;
    expect(node.getAttribute('aria-label')).toBe('Delete');
    expect(
      document.getElementById(node.getAttribute('aria-describedby')!)
        ?.textContent
    ).toBe('Removes the item');
    expect(node.classList.contains('uas-preferred')).toBe(true);
  });

  it('colors rows from the processed colors, destructive first', () => {
    sheets.showSheet(
      sheet({ tintColor: 0x80ff0000, cancelButtonTintColor: 0xff00ff00 }),
      () => {}
    );

    expect(row('Share').style.getPropertyValue('--uas-row')).toBe(
      'rgba(255, 0, 0, 0.502)'
    );
    expect(row('Delete').style.getPropertyValue('--uas-row')).toBe(
      'var(--uas-error)'
    );
    expect(row('Cancel').style.getPropertyValue('--uas-row')).toBe(
      'rgba(0, 255, 0, 1)'
    );
  });

  it('dismisses the top sheet, or all of them, as -2', async () => {
    const first = sheets.showSheet(sheet(), () => {});
    const second = sheets.showSheet(sheet(), () => {});

    sheets.dismissTop();
    await expect(second).resolves.toBe(-2);
    expect(document.querySelectorAll('.uas-open')).toHaveLength(1);

    const third = sheets.showSheet(sheet(), () => {});
    sheets.dismissAll();
    await expect(first).resolves.toBe(-2);
    await expect(third).resolves.toBe(-2);
  });

  it('places an anchored popup under its anchor, without the cancel row', () => {
    sheets.showSheet(
      sheet({
        presentationStyle: 'anchored',
        anchorRect: { x: 40, y: 100, width: 120, height: 30 },
      }),
      () => {}
    );

    expect(document.querySelector('.uas-anchored')).not.toBeNull();
    expect(panel().style.left).toBe('40px');
    expect(panel().style.top).toBe('134px');
    expect(row('Cancel')).toBeUndefined();
  });

  it('centers an anchored sheet whose anchor was not measured', () => {
    sheets.showSheet(sheet({ presentationStyle: 'anchored' }), () => {});

    expect(document.querySelector('.uas-centered')).not.toBeNull();
  });

  it('opens a bottom sheet at its first detent', () => {
    sheets.showSheet(
      sheet({ presentationStyle: 'bottom', detents: ['medium', 'large'] }),
      () => {}
    );

    expect(document.querySelector('.uas-bottom')).not.toBeNull();
    expect(panel().style.height).toBe('50vh');
  });

  it('focuses the first enabled row, traps Tab, and restores focus on close', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const result = sheets.showSheet(
      sheet({
        buttons: [
          { label: 'Off', disabled: true },
          { label: 'A' },
          { label: 'Cancel', style: 'cancel' },
        ],
      }),
      () => {}
    );

    expect(document.activeElement).toBe(row('A'));
    row('Cancel').focus();
    key('Tab');
    expect(document.activeElement).toBe(row('A'));
    key('Tab', { shiftKey: true });
    expect(document.activeElement).toBe(row('Cancel'));

    key('Escape');
    await result;
    expect(document.activeElement).toBe(opener);
  });

  it('locks page scrolling while a sheet is open', () => {
    document.body.style.overflow = 'auto';
    sheets.showSheet(sheet(), () => {});
    expect(document.body.style.overflow).toBe('hidden');

    sheets.dismissAll();
    expect(document.body.style.overflow).toBe('auto');
  });
});

describe('cancelable: false on the web', () => {
  it('ignores Escape and a backdrop click, but not a button', async () => {
    const result = sheets.showSheet(sheet({ cancelable: false }), () => {});

    key('Escape');
    Array.from(document.querySelectorAll<HTMLElement>('.uas-scrim'))
      .pop()!
      .click();
    expect(document.querySelectorAll('.uas-open')).toHaveLength(1);

    row('Share').click();
    await expect(result).resolves.toBe(0);
  });

  it('still closes from code, and applies to prompts', async () => {
    const result = sheets.showPrompt(
      { buttons: [{ label: 'OK' }], cancelable: false },
      () => {}
    );

    key('Escape');
    expect(document.querySelectorAll('.uas-open')).toHaveLength(1);

    sheets.dismissTop();
    await expect(result).resolves.toMatchObject({ buttonIndex: -2 });
  });
});

describe('web prompts', () => {
  const prompt = (overrides: Partial<PromptWire> = {}): PromptWire => ({
    buttons: [
      { label: 'Save', preferred: true, requiresText: true },
      { label: 'Cancel', style: 'cancel' },
    ],
    ...overrides,
  });
  const fields = () =>
    Array.from(document.querySelectorAll<HTMLInputElement>('.uas-field'));
  const type = (field: HTMLInputElement, text: string) => {
    field.value = text;
    field.dispatchEvent(new Event('input'));
  };

  it('keeps requiresText buttons disabled until the field has text', () => {
    sheets.showPrompt(prompt(), () => {});

    expect(row('Save').disabled).toBe(true);
    type(fields()[0]!, 'Notes');
    expect(row('Save').disabled).toBe(false);
  });

  it('presses the preferred button on Enter and resolves the text', async () => {
    const result = sheets.showPrompt(
      prompt({ defaultValue: 'Draft', fieldTestID: 'name' }),
      () => {}
    );

    const field = document.querySelector<HTMLInputElement>(
      '[data-testid="name"]'
    )!;
    expect(document.activeElement).toBe(field);
    key('Enter');

    await expect(result).resolves.toEqual({
      buttonIndex: 0,
      text: 'Draft',
      password: '',
    });
  });

  it('adds a password field for login-password, Enter moving between them', async () => {
    const result = sheets.showPrompt(
      prompt({ type: 'login-password', keyboardType: 'email-address' }),
      () => {}
    );

    const [login, password] = fields();
    expect(login!.type).toBe('email');
    expect(login!.autocomplete).toBe('username');
    expect(password!.type).toBe('password');

    type(login!, 'a@b.co');
    key('Enter');
    expect(document.activeElement).toBe(password);
    type(password!, 'secret');
    key('Enter');

    await expect(result).resolves.toEqual({
      buttonIndex: 0,
      text: 'a@b.co',
      password: 'secret',
    });
  });

  it('masks a secure prompt and keeps the draft on a dismissal', async () => {
    const result = sheets.showPrompt(prompt({ type: 'secure-text' }), () => {});

    expect(fields()[0]!.type).toBe('password');
    type(fields()[0]!, '1234');
    sheets.dismissTop();

    await expect(result).resolves.toEqual({
      buttonIndex: -2,
      text: '1234',
      password: '',
    });
  });
});

describe('the public API on web', () => {
  type IndexModule = typeof import('../index');
  const load = (): IndexModule => require('../index');

  it('shows the sheet and resolves the value, running onPress', async () => {
    const { showActionSheetWithOptions } = load();
    const onPress = jest.fn();

    const result = showActionSheetWithOptions({
      tintColor: '#FF000080',
      options: [
        { label: 'Share', value: 'share', onPress },
        { label: 'Cancel', style: 'cancel' },
      ],
    });
    // index.tsx measures the anchor first, a microtask before the sheet opens.
    await Promise.resolve();
    row('Share').click();

    await expect(result).resolves.toEqual({
      reason: 'selected',
      buttonIndex: 0,
      value: 'share',
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(row('Share').style.getPropertyValue('--uas-row')).toBe(
      'rgba(255, 0, 0, 0.502)'
    );
  });

  it('resolves dismissed through dismissActionSheet()', async () => {
    const { showPromptWithOptions, dismissActionSheet } = load();

    const result = showPromptWithOptions({ options: [{ label: 'OK' }] });
    dismissActionSheet();

    await expect(result).resolves.toEqual({
      reason: 'dismissed',
      buttonIndex: undefined,
      text: '',
    });
  });
});
