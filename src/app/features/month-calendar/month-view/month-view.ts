import { AfterViewInit, Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { CalendarStore } from '../calendar-store';
import { dayKey } from '../calendar-db';
import type { Week } from '../working-days';

@Component({
  selector: 'app-month-view',
  styleUrl: './month-view.css',
  templateUrl: './month-view.html',
  host: { class: 'month-view-host' },
})
export class MonthView implements AfterViewInit, OnDestroy {
  private readonly store = inject(CalendarStore);

  protected readonly weeks = this.store.weeks;
  protected readonly monthLabel = this.store.monthLabel;
  protected readonly activeNoteKey = signal<string | null>(null);

  private tooltips: bootstrap.Tooltip[] = [];

  protected limitForDay(index: number): string {
    const perDay = this.store.perDayCredits();
    return perDay === null ? '—' : Math.round(perDay * index).toString();
  }

  ngAfterViewInit(): void {
    this.initializeTooltips();
  }

  ngOnDestroy(): void {
    this.cleanupTooltips();
  }

  private initializeTooltips(): void {
    const dayInputs = document.querySelectorAll('[data-bs-toggle="tooltip"][id^="day-"]');
    dayInputs.forEach((input) => {
      const tooltip = new bootstrap.Tooltip(input, {
        title: 'Maximum available tokens for this day based on your daily limit',
        placement: 'top',
        trigger: 'hover',
      });
      this.tooltips.push(tooltip);
    });
  }

  private cleanupTooltips(): void {
    this.tooltips.forEach((tooltip) => tooltip.dispose());
    this.tooltips = [];
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
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
    const firstDayOfWeek = week[0].date.getDay(); // 1=Mon, 2=Tue, etc.
    const placeholdersNeeded = firstDayOfWeek - 1;
    const result =
      placeholdersNeeded > 0 ? Array.from({ length: placeholdersNeeded }, (_, i) => i) : [];
    console.log(
      `[placeholdersBeforeWeek] firstDay=${week[0].date.toDateString()}, dayOfWeek=${firstDayOfWeek}, needed=${placeholdersNeeded}, result.length=${result.length}`,
    );
    return result;
  }

  protected placeholdersAfterWeek(week: Week, weekIndex: number, totalWeeks: number): number[] {
    if (weekIndex !== totalWeeks - 1 || week.length === 0) {
      return [];
    }
    const lastDayOfWeek = week[week.length - 1].date.getDay();
    const placeholdersNeeded = 5 - lastDayOfWeek;
    const result =
      placeholdersNeeded > 0 ? Array.from({ length: placeholdersNeeded }, (_, i) => i) : [];
    console.log(
      `[placeholdersAfterWeek] lastDay=${week[week.length - 1].date.toDateString()}, dayOfWeek=${lastDayOfWeek}, needed=${placeholdersNeeded}, result.length=${result.length}`,
    );
    return result;
  }
}
