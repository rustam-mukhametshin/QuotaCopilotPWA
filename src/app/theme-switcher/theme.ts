import { prefersReducedMotion } from '../shared/motion/motion';

export const THEME_MODES = ['light', 'solarized', 'dark', 'dracula', 'nord', 'auto'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_STORAGE_KEY = 'theme-preference';

export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const THEME_ICONS: Record<ThemeMode, string> = {
  light: '☀️',
  solarized: '🌅',
  dark: '🌙',
  dracula: '🧛',
  nord: '❄️',
  auto: '🔄',
};

export type ResolvedTheme = Exclude<ThemeMode, 'auto'>;

export const APP_THEME_ATTRIBUTE = 'data-app-theme';

export type BootstrapTheme = 'light' | 'dark';

const BOOTSTRAP_THEME_BY_THEME: Record<ResolvedTheme, BootstrapTheme> = {
  light: 'light',
  solarized: 'light',
  dark: 'dark',
  dracula: 'dark',
  nord: 'dark',
};

/** Bootstrap only knows light/dark; custom themes reuse one of them and recolor on top. */
export function bootstrapThemeFor(theme: ResolvedTheme): BootstrapTheme {
  return BOOTSTRAP_THEME_BY_THEME[theme];
}

/** Custom themes (Dracula, Nord, Solarized) are marked with `data-app-theme` on <html>. */
export function isCustomTheme(theme: ResolvedTheme): boolean {
  return theme !== bootstrapThemeFor(theme);
}

let pendingThemeTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

export function isThemeMode(value: string | null): value is ThemeMode {
  return THEME_MODES.some((mode) => mode === value);
}

export function readSavedThemeMode(): ThemeMode {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(saved) ? saved : 'auto';
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== 'auto') {
    return mode;
  }
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode): void {
  const htmlElement = document.documentElement;
  const newTheme = resolveTheme(mode);
  const currentBootstrapTheme = htmlElement.getAttribute('data-bs-theme');
  const currentAppTheme = htmlElement.getAttribute(APP_THEME_ATTRIBUTE);
  const previousTheme = currentAppTheme ?? currentBootstrapTheme;

  // Check if this is an actual theme change (not initial application)
  const isThemeChange = currentBootstrapTheme !== null && previousTheme !== newTheme;

  // Apply the theme
  htmlElement.setAttribute('data-bs-theme', bootstrapThemeFor(newTheme));
  if (isCustomTheme(newTheme)) {
    htmlElement.setAttribute(APP_THEME_ATTRIBUTE, newTheme);
  } else {
    htmlElement.removeAttribute(APP_THEME_ATTRIBUTE);
  }

  // Add transition animation only on actual changes (not on initialization) and when reduced motion is not preferred
  if (isThemeChange && !prefersReducedMotion()) {
    htmlElement.classList.add('theme-transition');

    // Clear any pending timeout
    if (pendingThemeTransitionTimeout) {
      clearTimeout(pendingThemeTransitionTimeout);
    }

    // Remove transition class after animation completes
    pendingThemeTransitionTimeout = setTimeout(() => {
      htmlElement.classList.remove('theme-transition');
      pendingThemeTransitionTimeout = null;
    }, 250); // Duration should match --motion-duration-slow
  }
}

/** Re-applies the theme on OS color-scheme changes while the saved mode is 'auto'. */
export function followSystemThemeInAutoMode(): void {
  window.matchMedia(DARK_SCHEME_QUERY).addEventListener('change', () => {
    if (readSavedThemeMode() === 'auto') {
      applyTheme('auto');
    }
  });
}
