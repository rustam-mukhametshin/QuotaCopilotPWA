import { Component, inject, signal } from '@angular/core';
import { CalendarStore } from '../calendar-store';
import { dayKey } from '../calendar-db';

@Component({
  selector: 'app-month-view',
  styleUrl: './month-view.css',
  templateUrl: './month-view.html',
})
export class MonthView {
  private readonly store = inject(CalendarStore);

  protected readonly weeks = this.store.weeks;
  protected readonly monthLabel = this.store.monthLabel;
  protected readonly activeNoteKey = signal<string | null>(null);

  protected limitForDay(index: number): string {
    const perDay = this.store.perDayCredits();
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

  protected placeholdersBeforeWeek(week: any[], weekIndex: number): number[] {
    if (weekIndex !== 0 || week.length === 0) {
      return [];
    }
    const firstDayOfWeek = week[0].date.getDay(); // 1=Mon, 2=Tue, etc.
    const placeholdersNeeded = firstDayOfWeek - 1;
    return placeholdersNeeded > 0 ? Array.from({ length: placeholdersNeeded }, (_, i) => i) : [];
  }

  protected placeholdersAfterWeek(week: any[], weekIndex: number, totalWeeks: number): number[] {
    if (weekIndex !== totalWeeks - 1 || week.length === 0) {
      return [];
    }
    const lastDayOfWeek = week[week.length - 1].date.getDay();
    const placeholdersNeeded = 5 - lastDayOfWeek;
    return placeholdersNeeded > 0 ? Array.from({ length: placeholdersNeeded }, (_, i) => i) : [];
  }
}
