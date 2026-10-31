import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CalendarStore } from '../features/month-calendar/calendar-store';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ThemeSwitcher } from '../theme-switcher/theme-switcher';
import { WeekendPreferences } from './weekend-preferences';

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
  private readonly preferences = inject(WeekendPreferences);
  private readonly store = inject(CalendarStore);

  protected readonly isOpen = signal(false);
  protected readonly showWeekends = this.preferences.showWeekends;
  protected readonly includeWeekends = this.store.includeWeekends;
  /** New "include weekends" value awaiting confirmation; `null` when no confirmation is shown. */
  protected readonly pendingIncludeWeekends = signal<boolean | null>(null);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.pendingIncludeWeekends.set(null);
    this.isOpen.set(false);
  }

  protected onModalContentClick(event: Event): void {
    event.stopPropagation();
  }

  protected onEscape(): void {
    if (this.pendingIncludeWeekends() !== null) {
      this.cancelIncludeWeekends();
      return;
    }
    if (this.isOpen()) {
      this.close();
    }
  }

  protected onShowWeekendsChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.preferences.setShowWeekends(checkbox.checked);
  }

  protected onIncludeWeekendsChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const requested = checkbox.checked;
    // Keep the checkbox unchanged until the user confirms the recalculation.
    checkbox.checked = this.includeWeekends();
    this.pendingIncludeWeekends.set(requested);
  }

  protected confirmIncludeWeekends(): void {
    const pending = this.pendingIncludeWeekends();
    if (pending === null) {
      return;
    }
    this.store.setIncludeWeekends(pending);
    this.pendingIncludeWeekends.set(null);
  }

  protected cancelIncludeWeekends(): void {
    this.pendingIncludeWeekends.set(null);
  }
}
