import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  APP_THEME_ATTRIBUTE,
  DARK_SCHEME_QUERY,
  THEME_ICONS,
  THEME_MODES,
  THEME_STORAGE_KEY,
  applyTheme,
  bootstrapThemeFor,
  isCustomTheme,
  isThemeMode,
  readSavedThemeMode,
  resolveTheme,
} from './theme';

describe('theme', () => {
  const html = document.documentElement;

  function resetDom(): void {
    html.removeAttribute('data-bs-theme');
    html.removeAttribute(APP_THEME_ATTRIBUTE);
    html.classList.remove('theme-transition');
  }

  function mockMatchMedia(prefersDark: boolean): void {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === DARK_SCHEME_QUERY ? prefersDark : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  }

  beforeEach(() => {
    localStorage.clear();
    resetDom();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
    resetDom();
  });

  describe('THEME_MODES and THEME_ICONS', () => {
    it('lists light themes first, then dark themes, then auto', () => {
      expect(THEME_MODES).toEqual(['light', 'solarized', 'dark', 'dracula', 'nord', 'auto']);
    });

    it('has a non-empty icon for every mode', () => {
      for (const mode of THEME_MODES) {
        expect(THEME_ICONS[mode]).toBeTruthy();
      }
      expect(Object.keys(THEME_ICONS).sort()).toEqual([...THEME_MODES].sort());
    });
  });

  describe('isThemeMode / readSavedThemeMode', () => {
    it('recognizes nord and solarized as theme modes', () => {
      expect(isThemeMode('nord')).toBe(true);
      expect(isThemeMode('solarized')).toBe(true);
    });

    it('rejects unknown values and null', () => {
      expect(isThemeMode('monokai')).toBe(false);
      expect(isThemeMode(null)).toBe(false);
    });

    it.each(['nord', 'solarized'] as const)('returns saved %s mode', (mode) => {
      localStorage.setItem(THEME_STORAGE_KEY, mode);

      expect(readSavedThemeMode()).toBe(mode);
    });

    it('falls back to auto for an invalid saved value', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'unknown');

      expect(readSavedThemeMode()).toBe('auto');
    });
  });

  describe('resolveTheme', () => {
    it('returns nord and solarized as-is', () => {
      expect(resolveTheme('nord')).toBe('nord');
      expect(resolveTheme('solarized')).toBe('solarized');
    });

    it('resolves auto to dark when the system prefers dark', () => {
      mockMatchMedia(true);

      expect(resolveTheme('auto')).toBe('dark');
    });

    it('resolves auto to light when the system prefers light', () => {
      mockMatchMedia(false);

      expect(resolveTheme('auto')).toBe('light');
    });
  });

  describe('bootstrapThemeFor', () => {
    it.each(['light', 'solarized'] as const)('maps %s to the light Bootstrap theme', (theme) => {
      expect(bootstrapThemeFor(theme)).toBe('light');
    });

    it.each(['dark', 'dracula', 'nord'] as const)(
      'maps %s to the dark Bootstrap theme',
      (theme) => {
        expect(bootstrapThemeFor(theme)).toBe('dark');
      },
    );
  });

  describe('isCustomTheme', () => {
    it.each(['dracula', 'nord', 'solarized'] as const)('is true for %s', (theme) => {
      expect(isCustomTheme(theme)).toBe(true);
    });

    it.each(['light', 'dark'] as const)('is false for %s', (theme) => {
      expect(isCustomTheme(theme)).toBe(false);
    });
  });

  describe('applyTheme', () => {
    it.each([
      ['nord', 'dark'],
      ['solarized', 'light'],
      ['dracula', 'dark'],
    ] as const)('applies %s on top of the %s Bootstrap theme', (mode, bootstrapTheme) => {
      applyTheme(mode);

      expect(html.getAttribute('data-bs-theme')).toBe(bootstrapTheme);
      expect(html.getAttribute(APP_THEME_ATTRIBUTE)).toBe(mode);
    });

    it.each([
      ['light', 'light'],
      ['dark', 'dark'],
    ] as const)('removes data-app-theme when switching to %s', (mode, bootstrapTheme) => {
      applyTheme('nord');

      applyTheme(mode);

      expect(html.getAttribute('data-bs-theme')).toBe(bootstrapTheme);
      expect(html.hasAttribute(APP_THEME_ATTRIBUTE)).toBe(false);
    });

    it('removes data-app-theme when switching to auto', () => {
      mockMatchMedia(true);
      applyTheme('solarized');

      applyTheme('auto');

      expect(html.getAttribute('data-bs-theme')).toBe('dark');
      expect(html.hasAttribute(APP_THEME_ATTRIBUTE)).toBe(false);
    });

    it('does not add theme-transition on initial application', () => {
      applyTheme('nord');

      expect(html.classList.contains('theme-transition')).toBe(false);
    });

    it.each([
      ['light', 'solarized'],
      ['dark', 'nord'],
    ] as const)('treats %s -> %s as a theme change despite the same Bootstrap base', (from, to) => {
      applyTheme(from);

      applyTheme(to);

      expect(html.classList.contains('theme-transition')).toBe(true);
    });

    it('removes theme-transition after the animation timeout', () => {
      applyTheme('light');
      applyTheme('solarized');

      vi.advanceTimersByTime(250);

      expect(html.classList.contains('theme-transition')).toBe(false);
    });

    it.each(['nord', 'solarized'] as const)(
      'does not add theme-transition when re-applying %s',
      (mode) => {
        applyTheme(mode);

        applyTheme(mode);

        expect(html.classList.contains('theme-transition')).toBe(false);
      },
    );
  });
});
