import { describe, it, expect } from 'vitest';
import {
  THEME_STORAGE_KEY,
  resolveInitialTheme,
  applyThemeClass,
} from '../src/shared/theme/ThemeProvider';

describe('Web Admin Theme System (Dark / Light)', () => {
  it('uses stable storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('cambiazo_theme');
  });

  it('prefers explicit stored theme over system preference', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
    expect(resolveInitialTheme('light', true)).toBe('light');
  });

  it('falls back to system preference when no valid theme is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(undefined, false)).toBe('light');
    expect(resolveInitialTheme('invalid', true)).toBe('dark');
  });

  it('toggles the dark class cleanly on target element', () => {
    const classes = new Set<string>();
    const fakeRoot = {
      classList: {
        add: (cls: string) => classes.add(cls),
        remove: (cls: string) => classes.delete(cls),
      },
    } as unknown as HTMLElement;

    applyThemeClass('dark', fakeRoot);
    expect(classes.has('dark')).toBe(true);

    applyThemeClass('light', fakeRoot);
    expect(classes.has('dark')).toBe(false);
  });
});

