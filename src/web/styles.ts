/// <reference lib="dom" />
/// The web sheets' look: the Android dialog's palette, sizes and spacing, so
/// the two read as the same component. Injected once, on the first sheet.

export interface Palette {
  surface: string;
  primaryText: string;
  secondaryText: string;
  error: string;
}

const LIGHT: Palette = {
  surface: '#ECE6F0',
  primaryText: '#1D1B20',
  secondaryText: '#49454F',
  error: '#B3261E',
};

const DARK: Palette = {
  surface: '#2B2930',
  primaryText: '#E6E0E9',
  secondaryText: '#CAC4D0',
  error: '#F2B8B5',
};

/// userInterfaceStyle wins; otherwise the system setting at open time, as on
/// Android.
export const paletteFor = (style: string | undefined): Palette => {
  if (style === 'dark') return DARK;
  if (style === 'light') return LIGHT;

  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  return prefersDark ? DARK : LIGHT;
};

/// A processColor result (ARGB as a 32-bit number) as a CSS color.
/* eslint-disable no-bitwise -- unpacking ARGB channels */
export const cssColor = (argb: number | undefined): string | undefined => {
  if (argb == null) return undefined;

  const value = argb >>> 0;
  const alpha = Math.round((((value >>> 24) & 0xff) / 255) * 1000) / 1000;

  return `rgba(${(value >>> 16) & 0xff}, ${(value >>> 8) & 0xff}, ${value & 0xff}, ${alpha})`;
};
/* eslint-enable no-bitwise */

/// How long the open and close transitions run; onShow fires after the open.
export const TRANSITION_MS = 150;

const STYLE_ID = 'react-native-unified-action-sheet';

const CSS = `
.uas-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.uas-scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  opacity: 0;
  transition: opacity ${TRANSITION_MS}ms ease-out;
}
.uas-anchored .uas-scrim { background: transparent; }
.uas-open .uas-scrim { opacity: 1; }
.uas-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-height: 90vh;
  overflow: hidden;
  background: var(--uas-surface);
  color: var(--uas-primary);
  font: 16px/1.4 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  outline: none;
  opacity: 0;
  transition: opacity ${TRANSITION_MS}ms ease-out, transform ${TRANSITION_MS}ms ease-out;
}
.uas-centered .uas-panel {
  width: min(560px, max(280px, calc(100vw - 48px)));
  max-width: 100vw;
  padding: 8px 8px 16px;
  border-radius: 28px;
  transform: scale(0.95);
}
.uas-bottom { align-items: flex-end; }
.uas-bottom .uas-panel {
  width: min(100vw, 640px);
  padding: 8px 8px max(16px, env(safe-area-inset-bottom));
  border-radius: 28px 28px 0 0;
  transform: translateY(32px);
}
.uas-anchored .uas-panel {
  position: absolute;
  min-width: 180px;
  max-width: 280px;
  padding: 8px 0;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
/* After the layout rules, so the open state wins over their closed transforms. */
.uas-open .uas-panel { opacity: 1; transform: none; }
.uas-header {
  padding: 12px 16px 8px;
  text-align: center;
  color: var(--uas-secondary);
  font-size: 14px;
}
.uas-header.uas-message { font-size: 12px; }
.uas-fields { display: flex; flex-direction: column; }
.uas-field {
  margin: 4px 16px;
  padding: 8px 0;
  border: none;
  border-bottom: 1px solid var(--uas-secondary);
  background: transparent;
  color: var(--uas-primary);
  font: inherit;
  outline: none;
}
.uas-field:focus { border-bottom: 2px solid var(--uas-primary); }
.uas-field::placeholder { color: var(--uas-secondary); opacity: 0.6; }
.uas-rows {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}
.uas-row {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: 100%;
  padding: 16px;
  font-size: 16px;
  text-align: start;
  color: var(--uas-row);
  cursor: pointer;
}
.uas-center-labels .uas-row { text-align: center; }
.uas-row.uas-preferred { font-weight: 700; }
.uas-row:hover:not(:disabled) { background: var(--uas-pressed); }
.uas-row:focus-visible {
  background: var(--uas-pressed);
  outline: 2px solid var(--uas-primary);
  outline-offset: -2px;
}
.uas-row:disabled { color: var(--uas-disabled); cursor: default; }
.uas-spacer { flex: none; height: 8px; }
.uas-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .uas-scrim, .uas-panel { transition: none; }
}
`;

export const injectStyles = (): void => {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
};
