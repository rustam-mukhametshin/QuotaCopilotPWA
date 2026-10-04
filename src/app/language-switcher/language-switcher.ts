import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LANGUAGE_STORAGE_KEY, type LanguageCode, SUPPORTED_LANGUAGES } from './languages';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  templateUrl: './language-switcher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  private readonly translate = inject(TranslateService);

  protected readonly languages = SUPPORTED_LANGUAGES;
  protected readonly currentLang = this.translate.currentLang;

  protected selectLanguage(code: LanguageCode): void {
    this.translate.use(code);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  }
}
