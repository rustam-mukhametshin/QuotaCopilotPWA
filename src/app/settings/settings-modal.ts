import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ThemeSwitcher } from '../theme-switcher/theme-switcher';

@Component({
  selector: 'app-settings-modal',
  imports: [TranslatePipe, ThemeSwitcher, LanguageSwitcher],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class SettingsModal {
  protected readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  protected onModalContentClick(event: Event): void {
    event.stopPropagation();
  }

  protected onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
}
