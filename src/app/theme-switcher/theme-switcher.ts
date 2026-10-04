import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  DARK_SCHEME_QUERY,
  THEME_ICONS,
  THEME_MODES,
  THEME_STORAGE_KEY,
  type ThemeMode,
  applyTheme,
  readSavedThemeMode,
} from './theme';

@Component({
  selector: 'app-theme-switcher',
  imports: [TranslatePipe],
  templateUrl: './theme-switcher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitcher {
  protected readonly modes = THEME_MODES;
  protected readonly icons = THEME_ICONS;
  protected readonly currentTheme = signal<ThemeMode>(readSavedThemeMode());
  protected readonly currentIcon = computed(() => THEME_ICONS[this.currentTheme()]);

  constructor() {
    this.followSystemThemeInAutoMode();
  }

  protected setTheme(mode: ThemeMode): void {
    this.currentTheme.set(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    applyTheme(mode);
  }

  private followSystemThemeInAutoMode(): void {
    const darkSchemeQuery = window.matchMedia(DARK_SCHEME_QUERY);
    const onSystemThemeChange = (): void => {
      if (this.currentTheme() === 'auto') {
        applyTheme('auto');
      }
    };

    darkSchemeQuery.addEventListener('change', onSystemThemeChange);
    inject(DestroyRef).onDestroy(() =>
      darkSchemeQuery.removeEventListener('change', onSystemThemeChange),
    );
  }
}
