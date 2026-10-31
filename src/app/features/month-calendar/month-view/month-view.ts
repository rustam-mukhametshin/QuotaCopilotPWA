import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CalendarStore } from '../calendar-store';
import { dayKey } from '../calendar-db';
import type { Week } from '../working-days';
import { weekdayColumn } from '../working-days';
import { tweenedNumber } from '../../../shared/motion/tweened-number';
import { WeekendPreferences } from '../../../settings/weekend-preferences';
import { Tooltip } from '../../../shared/tooltip/tooltip';

@Component({
  selector: 'app-month-view',
  imports: [TranslatePipe, Tooltip],
  styleUrl: './month-view.css',
  templateUrl: './month-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class MonthView {
  private readonly store = inject(CalendarStore);
  private readonly preferences = inject(WeekendPreferences);

  protected readonly weeks = this.store.visibleWeeks;
  protected readonly columns = computed(() => (this.preferences.showWeekends() ? 7 : 5));
  protected readonly dayKey = dayKey;
  protected readonly activeNoteKey = signal<string | null>(null);

  protected readonly monthKey = computed(() => {
    const ref = this.store.reference();
    const year = ref.getFullYear();
    const month = String(ref.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  protected readonly tweenedPerDayCredits = tweenedNumber(this.store.perDayCredits);

  protected limitForDay(index: number): string {
    const perDay = this.tweenedPerDayCredits();
    return perDay === null ? '—' : Math.round(perDay * index).toString();
  }

  protected noteFor(date: Date): string {
    const key = dayKey(date);
    return this.store.dayNotes()[key] ?? '';
  }

  protected hasNote(date: Date): boolean {
    return this.noteFor(date).trim().length > 0;
  }

  protected setNote(date: Date, value: string): void {
    const key = dayKey(date);
    this.store.setDayNote(key, value);
  }

  protected onNoteInput(date: Date, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.setNote(date, value);
  }

  protected onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const isTextarea = target.classList.contains('day__note-textarea');
    const isButton = target.classList.contains('day__note-toggle');

    if (!isTextarea && !isButton) {
      this.activeNoteKey.set(null);
    }
  }

  protected toggleNote(dateKey: string): void {
    if (this.activeNoteKey() === dateKey) {
      this.activeNoteKey.set(null);
    } else {
      this.activeNoteKey.set(dateKey);
    }
  }

  protected placeholdersBeforeWeek(week: Week, weekIndex: number): number[] {
    if (weekIndex !== 0 || week.length === 0) {
      return [];
    }
    return this.range(weekdayColumn(week[0].date));
  }

  protected placeholdersAfterWeek(week: Week, weekIndex: number, totalWeeks: number): number[] {
    if (weekIndex !== totalWeeks - 1 || week.length === 0) {
      return [];
    }
    return this.range(this.columns() - 1 - weekdayColumn(week[week.length - 1].date));
  }

  private range(length: number): number[] {
    return Array.from({ length: Math.max(0, length) }, (_, i) => i);
  }
}
