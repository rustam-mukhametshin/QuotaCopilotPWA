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
  document.documentElement.setAttribute('data-bs-theme', resolveTheme(mode));
}
