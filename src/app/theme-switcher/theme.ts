import { prefersReducedMotion } from '../shared/motion/motion';

export const THEME_MODES = ['light', 'dark', 'auto'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_STORAGE_KEY = 'theme-preference';

export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const THEME_ICONS: Record<ThemeMode, string> = {
  light: '☀️',
  dark: '🌙',
  auto: '🔄',
};

export type ResolvedTheme = Exclude<ThemeMode, 'auto'>;

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
  const currentTheme = htmlElement.getAttribute('data-bs-theme');

  // Check if this is an actual theme change (not initial application)
  const isThemeChange = currentTheme !== null && currentTheme !== newTheme;

  // Apply the theme
  htmlElement.setAttribute('data-bs-theme', newTheme);

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
