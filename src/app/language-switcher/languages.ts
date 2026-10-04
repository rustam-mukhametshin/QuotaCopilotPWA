export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LANGUAGE_STORAGE_KEY = 'language';

export function isSupportedLanguage(value: string | null): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some((language) => language.code === value);
}

/** Saved choice first, then the first supported browser language, then the default. */
export function resolveInitialLanguage(): LanguageCode {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(saved)) {
    return saved;
  }

  const browserLanguage = navigator.languages
    .map((tag) => tag.split('-')[0].toLowerCase())
    .find(isSupportedLanguage);

  return browserLanguage ?? DEFAULT_LANGUAGE;
}
