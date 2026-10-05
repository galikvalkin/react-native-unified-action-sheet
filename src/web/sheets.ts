/// <reference lib="dom" />
import { DISMISSED_BY_API } from '../wire';
import type { PromptReply, PromptWire, SheetWire, WireButton } from '../wire';
import { cssColor, injectStyles, paletteFor, TRANSITION_MS } from './styles';

/// The web half of the library: sheets and prompts drawn with plain DOM on
/// document.body, so the imperative API needs no provider or setup. It takes
/// the same wire options as the native modules and resolves the same index,
/// so index.tsx (values, onPress, onShow, reasons) is shared unchanged.

/// What sheets and prompts have in common, as the wire sends it.
type Content = Pick<
  SheetWire,
  | 'title'
  | 'message'
  | 'buttons'
  | 'tintColor'
  | 'cancelButtonTintColor'
  | 'destructiveColor'
  | 'buttonTextAlignment'
  | 'userInterfaceStyle'
  | 'testID'
>;

type Rect = NonNullable<SheetWire['anchorRect']>;

type Layout =
  | { kind: 'centered' }
  | { kind: 'bottom'; detent: string | undefined }
  | { kind: 'anchored'; rect: Rect; alignment: string | undefined };

interface OpenSheet {
  close: (index: number) => void;
}

/// Open sheets, oldest first; the last one is on top.
const stack: OpenSheet[] = [];

/// Above any app content, leaving room to stack.
const Z_BASE = 2147483000;

/// The body's own overflow, restored when the last sheet closes.
let savedBodyOverflow: string | null = null;

let nextId = 0;
const uniqueId = (name: string) => `uas-${name}-${++nextId}`;

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/// '#RRGGBB' with an alpha, for the dimmed and pressed shades of a palette
/// color, as Android derives them.
/* eslint-disable no-bitwise -- unpacking RGB channels */
const withAlpha = (hex: string, alpha: number): string => {
  const value = parseInt(hex.slice(1), 16);

  return `rgba(${(value >> 16) & 0xff}, ${(value >> 8) & 0xff}, ${value & 0xff}, ${alpha})`;
};
/* eslint-enable no-bitwise */

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;

  return node;
};

const setTestID = (node: HTMLElement, testID: string | undefined) => {
  // React Native Web's own mapping for testID.
  if (testID) node.setAttribute('data-testid', testID);
};

/// The rows of a sheet or prompt, in display order; the cancel row last,
/// after a gap, as on Android. Returns each row with its button index.
const buildRows = (
  content: Content,
  includeCancel: boolean,
  hints: HTMLElement,
  onSelect: (index: number) => void
): { list: HTMLElement; rows: Map<number, HTMLButtonElement> } => {
  const list = element('div', 'uas-rows');
  const rows = new Map<number, HTMLButtonElement>();
  const optionColor = cssColor(content.tintColor) ?? 'var(--uas-primary)';
  const cancelColor = cssColor(content.cancelButtonTintColor) ?? optionColor;
  const destructiveColor =
    cssColor(content.destructiveColor) ?? 'var(--uas-error)';

  const row = (button: WireButton, index: number) => {
    const node = element(
      'button',
      button.preferred ? 'uas-row uas-preferred' : 'uas-row'
    );
    node.type = 'button';
    node.textContent = button.label;
    node.disabled = Boolean(button.disabled);
    // Precedence matches both native sides: destructive > cancel > tint.
    node.style.setProperty(
      '--uas-row',
      button.style === 'destructive'
        ? destructiveColor
        : button.style === 'cancel'
          ? cancelColor
          : optionColor
    );
    setTestID(node, button.testID);
    if (button.accessibilityLabel) {
      node.setAttribute('aria-label', button.accessibilityLabel);
    }
    if (button.accessibilityHint) {
      const hint = element('span');
      hint.id = uniqueId('hint');
      hint.textContent = button.accessibilityHint;
      hints.appendChild(hint);
      node.setAttribute('aria-describedby', hint.id);
    }
    node.addEventListener('click', () => onSelect(index));
    rows.set(index, node);

    return node;
  };

  content.buttons.forEach((button, index) => {
    if (button.style !== 'cancel') list.appendChild(row(button, index));
  });

  const cancelIndex = content.buttons.findIndex(
    (button) => button.style === 'cancel'
  );
  const cancel = content.buttons[cancelIndex];
  if (includeCancel && cancel) {
    list.appendChild(element('div', 'uas-spacer'));
    list.appendChild(row(cancel, cancelIndex));
  }

  return { list, rows };
};

/// Keeps an anchored panel next to its anchor: below it, or above when there
/// is more room there, aligned per anchorAlignment and kept on screen.
const placeAnchored = (
  panel: HTMLElement,
  rect: Rect,
  alignment: string | undefined
) => {
  const margin = 8;
  const gap = 4;
  panel.style.maxHeight = '';

  const width = panel.offsetWidth;
  let height = panel.offsetHeight;
  const below = window.innerHeight - (rect.y + rect.height) - gap - margin;
  const above = rect.y - gap - margin;
  const showBelow = height <= below || below >= above;
  const room = Math.max(showBelow ? below : above, 0);
  if (height > room) {
    panel.style.maxHeight = `${room}px`;
    height = room;
  }

  const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
  const preferredLeft =
    alignment === 'center'
      ? rect.x + rect.width / 2 - width / 2
      : rtl
        ? rect.x + rect.width - width
        : rect.x;
  const left = Math.min(
    Math.max(preferredLeft, margin),
    Math.max(window.innerWidth - margin - width, margin)
  );

  panel.style.left = `${left}px`;
  panel.style.top = `${showBelow ? rect.y + rect.height + gap : rect.y - gap - height}px`;
};

/// Opens one sheet or prompt and calls onClose once, with the index it closed
/// with: a button, the cancel button (or -1) for Escape and backdrop taps, or
/// DISMISSED_BY_API from dismissTop() and dismissAll().
const open = ({
  content,
  layout,
  fields = [],
  onShow,
  onClose,
}: {
  content: Content;
  layout: Layout;
  fields?: HTMLInputElement[];
  onShow: () => void;
  onClose: (index: number) => void;
}) => {
  injectStyles();

  const palette = paletteFor(content.userInterfaceStyle);
  const cancelIndex = content.buttons.findIndex(
    (button) => button.style === 'cancel'
  );
  const reducedMotion = prefersReducedMotion();
  const previousFocus = document.activeElement;

  const overlay = element('div', `uas-overlay uas-${layout.kind}`);
  overlay.style.zIndex = String(Z_BASE + stack.length);
  const scrim = element('div', 'uas-scrim');
  const panel = element('div', 'uas-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.tabIndex = -1;
  setTestID(panel, content.testID);
  if (content.buttonTextAlignment === 'center') {
    panel.classList.add('uas-center-labels');
  }
  panel.style.setProperty('--uas-surface', palette.surface);
  panel.style.setProperty('--uas-primary', palette.primaryText);
  panel.style.setProperty('--uas-secondary', palette.secondaryText);
  panel.style.setProperty('--uas-error', palette.error);
  panel.style.setProperty(
    '--uas-disabled',
    withAlpha(palette.primaryText, 0.38)
  );
  panel.style.setProperty(
    '--uas-pressed',
    withAlpha(palette.primaryText, 0.08)
  );

  if (content.title) {
    const title = element('div', 'uas-header');
    title.id = uniqueId('title');
    title.textContent = content.title;
    title.setAttribute('role', 'heading');
    title.setAttribute('aria-level', '2');
    panel.appendChild(title);
    panel.setAttribute('aria-labelledby', title.id);
  }
  if (content.message) {
    const message = element('div', 'uas-header uas-message');
    message.id = uniqueId('message');
    message.textContent = content.message;
    panel.appendChild(message);
    if (content.title) {
      panel.setAttribute('aria-describedby', message.id);
    } else {
      panel.setAttribute('aria-labelledby', message.id);
    }
  }

  if (fields.length > 0) {
    const box = element('div', 'uas-fields');
    fields.forEach((field) => box.appendChild(field));
    panel.appendChild(box);
  }

  const hints = element('div', 'uas-hidden');
  // An anchored popup has no cancel row, as on Android and iPad: tapping
  // outside or Escape is the way out.
  const { list, rows } = buildRows(
    content,
    layout.kind !== 'anchored',
    hints,
    (index) => close(index)
  );
  panel.appendChild(list);
  panel.appendChild(hints);

  if (layout.kind === 'bottom') {
    // The opening height. The web sheet does not drag between detents.
    if (layout.detent === 'medium') panel.style.height = '50vh';
    if (layout.detent === 'large') {
      panel.style.height = 'calc(100vh - 24px)';
      panel.style.maxHeight = 'calc(100vh - 24px)';
    }
  }

  // requiresText: those buttons stay disabled while any field is empty.
  const textRequired = content.buttons.flatMap((button, index) =>
    button.requiresText ? [index] : []
  );
  const updateTextRequired = () => {
    const filled = fields.every((field) => field.value !== '');
    textRequired.forEach((index) => {
      const row = rows.get(index);
      if (row)
        row.disabled = !filled || Boolean(content.buttons[index]?.disabled);
    });
  };
  if (textRequired.length > 0) {
    fields.forEach((field) =>
      field.addEventListener('input', updateTextRequired)
    );
    // A defaultValue may already satisfy it.
    updateTextRequired();
  }

  // Enter moves to the next field, then presses the preferred button, as the
  // return key does in an iOS alert and the action key on Android.
  const preferredIndex = content.buttons.findIndex(
    (button) => button.preferred
  );
  fields.forEach((field, position) => {
    field.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const next = fields[position + 1];
      if (next) return next.focus();
      const preferred = rows.get(preferredIndex);
      if (preferred && !preferred.disabled) preferred.click();
    });
  });

  const focusables = () =>
    Array.from(
      panel.querySelectorAll<HTMLElement>('input, button:not(:disabled)')
    );

  const onKeyDown = (event: KeyboardEvent) => {
    if (stack[stack.length - 1] !== sheet) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close(cancelIndex);
    } else if (event.key === 'Tab') {
      // Keep focus inside the sheet while it is open.
      const items = focusables();
      if (items.length === 0) return event.preventDefault();
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !panel.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const place = () => {
    if (layout.kind === 'anchored') {
      placeAnchored(panel, layout.rect, layout.alignment);
    }
  };

  let closed = false;
  let shown = false;
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  const markShown = () => {
    if (shown) return;
    shown = true;
    onShow();
  };

  const close = (index: number) => {
    if (closed) return;
    closed = true;
    clearTimeout(showTimer);
    // Closed mid-transition: it did appear, so onShow still runs, before the
    // promise resolves, as on iOS.
    markShown();
    stack.splice(stack.indexOf(sheet), 1);
    overlay.classList.remove('uas-open');
    // Fading out: let clicks through to the page, or to a sheet opened next.
    overlay.style.pointerEvents = 'none';
    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('resize', place);
    setTimeout(() => overlay.remove(), reducedMotion ? 0 : TRANSITION_MS);

    if (stack.length === 0 && savedBodyOverflow !== null) {
      document.body.style.overflow = savedBodyOverflow;
      savedBodyOverflow = null;
    }
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
      previousFocus.focus();
    }

    onClose(index);
  };

  const sheet: OpenSheet = { close };

  // A backdrop tap cancels, like Android's touch outside and iOS's dimmed area.
  scrim.addEventListener('click', () => close(cancelIndex));
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('resize', place);

  overlay.appendChild(scrim);
  overlay.appendChild(panel);
  if (stack.length === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  stack.push(sheet);
  document.body.appendChild(overlay);
  place();

  // Start the transition from the closed styles just applied: reading layout
  // flushes them before the open class lands.
  overlay.getBoundingClientRect();
  overlay.classList.add('uas-open');

  // A prompt is for typing: focus its field, caret after any default value.
  // A sheet focuses its first enabled button, the dialog pattern's default.
  const firstField = fields[0];
  if (firstField) {
    firstField.focus();
    try {
      firstField.setSelectionRange(
        firstField.value.length,
        firstField.value.length
      );
    } catch {
      // Email and number fields have no selection API, and throw.
    }
  } else {
    (focusables()[0] ?? panel).focus();
  }

  // onShow once the open transition has run, as iOS calls it after its
  // presentation animation.
  showTimer = setTimeout(markShown, reducedMotion ? 0 : TRANSITION_MS);
};

export const showSheet = (
  options: SheetWire,
  onShow: () => void
): Promise<number> =>
  new Promise((resolve) => {
    const rect = options.anchorRect;
    const layout: Layout =
      options.presentationStyle === 'bottom'
        ? { kind: 'bottom', detent: options.detents?.[0] }
        : options.presentationStyle === 'anchored' &&
            rect &&
            rect.width > 0 &&
            rect.height > 0
          ? { kind: 'anchored', rect, alignment: options.anchorAlignment }
          : // Unset, centered, and anchored without a measured anchor, as on
            // Android.
            { kind: 'centered' };

    open({ content: options, layout, onShow, onClose: resolve });
  });

/// The field, or for 'login-password' the login and password fields.
const buildFields = (options: PromptWire): HTMLInputElement[] => {
  const field = (
    placeholder: string | undefined,
    testID: string | undefined
  ) => {
    const input = element('input', 'uas-field');
    input.placeholder = placeholder ?? '';
    input.setAttribute('aria-label', placeholder || options.title || 'Text');
    setTestID(input, testID);

    return input;
  };

  const type = options.type ?? 'plain-text';
  const first = field(options.placeholder, options.fieldTestID);
  first.value = options.defaultValue ?? '';

  switch (options.keyboardType) {
    case 'email-address':
      first.type = 'email';
      break;
    case 'numeric':
      first.inputMode = 'numeric';
      break;
    case 'phone-pad':
      first.type = 'tel';
      break;
    case 'url':
      first.type = 'url';
      break;
  }
  // After the keyboard type: masking keeps the numeric keypad, as on Android.
  if (type === 'secure-text') first.type = 'password';
  if (type !== 'login-password') return [first];

  // The autocomplete hints let the browser offer saved credentials.
  first.autocomplete = 'username';
  const password = field(
    options.passwordPlaceholder,
    options.passwordFieldTestID
  );
  password.type = 'password';
  password.autocomplete = 'current-password';

  return [first, password];
};

export const showPrompt = (
  options: PromptWire,
  onShow: () => void
): Promise<PromptReply> =>
  new Promise((resolve) => {
    const fields = buildFields(options);

    open({
      content: options,
      layout: { kind: 'centered' },
      fields,
      onShow,
      // Read at close, so a dismissal still carries the draft.
      onClose: (buttonIndex) =>
        resolve({
          buttonIndex,
          text: fields[0]?.value ?? '',
          password: fields[1]?.value ?? '',
        }),
    });
  });

export const dismissTop = (): void => {
  stack[stack.length - 1]?.close(DISMISSED_BY_API);
};

export const dismissAll = (): void => {
  [...stack].reverse().forEach((sheet) => sheet.close(DISMISSED_BY_API));
};
