import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CalendarStore } from '../features/month-calendar/calendar-store';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ThemeSwitcher } from '../theme-switcher/theme-switcher';
import { WeekendPreferences } from './weekend-preferences';

@Component({
  selector: 'app-settings-modal',
  imports: [TranslatePipe, ThemeSwitcher, LanguageSwitcher, ConfirmDialog],
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
  /** Weekends can only be included while they are shown. */
  protected readonly includeWeekendsChecked = computed(
    () => this.showWeekends() && this.includeWeekends(),
  );
  protected readonly pendingHideWeekends = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.pendingIncludeWeekends.set(null);
    this.pendingHideWeekends.set(false);
    this.isOpen.set(false);
  }

  protected onModalContentClick(event: Event): void {
    event.stopPropagation();
  }

  protected onEscape(): void {
    if (this.pendingHideWeekends()) {
      this.cancelHideWeekends();
      return;
    }
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
    if (!checkbox.checked && this.includeWeekends()) {
      // Keep weekends shown until the user confirms excluding them from calculations.
      checkbox.checked = true;
      this.pendingHideWeekends.set(true);
      return;
    }
    this.preferences.setShowWeekends(checkbox.checked);
  }

  protected confirmHideWeekends(): void {
    this.preferences.setShowWeekends(false);
    this.store.setIncludeWeekends(false);
    this.pendingHideWeekends.set(false);
  }

  protected cancelHideWeekends(): void {
    this.pendingHideWeekends.set(false);
  }

  protected onIncludeWeekendsChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (!this.showWeekends()) {
      checkbox.checked = this.includeWeekendsChecked();
      return;
    }
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
