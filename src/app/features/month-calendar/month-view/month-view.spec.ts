import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MonthView } from './month-view';
import { CalendarStore } from '../calendar-store';
import type { DayInfo, Week } from '../working-days';

/** Access to protected members of MonthView for logic-only tests (template is never rendered). */
interface MonthViewLogic {
  limitForDay(index: number): string;
  noteFor(date: Date): string;
  hasNote(date: Date): boolean;
  setNote(date: Date, value: string): void;
  toggleNote(dateKey: string): void;
  onDocumentClick(event: Event): void;
  activeNoteKey: () => string | null;
  placeholdersBeforeWeek(week: Week, weekIndex: number): number[];
  placeholdersAfterWeek(week: Week, weekIndex: number, totalWeeks: number): number[];
}

function day(year: number, month: number, date: number, index = 1): DayInfo {
  return { date: new Date(year, month - 1, date), isToday: false, isPast: false, index };
}

function clickEventOn(className: string): Event {
  const target = document.createElement('div');
  if (className) {
    target.classList.add(className);
  }
  return { target } as unknown as Event;
}

describe('MonthView (logic)', () => {
  let store: CalendarStore;
  let view: MonthViewLogic;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ imports: [MonthView] });
    store = TestBed.inject(CalendarStore);
    store.reference.set(new Date(2024, 1, 1)); // February 2024: 21 working days
    view = TestBed.createComponent(MonthView).componentInstance as unknown as MonthViewLogic;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('limitForDay', () => {
    it('returns "—" when the credits budget is not set', () => {
      store.totalAiCredits.set(null);

      expect(view.limitForDay(5)).toBe('—');
    });

    it('returns the cumulative rounded limit for the given working-day index', () => {
      store.totalAiCredits.set(2100); // 100 per day

      expect(view.limitForDay(1)).toBe('100');
      expect(view.limitForDay(21)).toBe('2100');
    });

    it('rounds the cumulative value', () => {
      store.totalAiCredits.set(1000); // 47.619... per day

      expect(view.limitForDay(1)).toBe('48');
      expect(view.limitForDay(2)).toBe('95');
    });
  });

  describe('notes', () => {
    const date = new Date(2024, 1, 15);

    it('noteFor returns an empty string when the day has no note', () => {
      expect(view.noteFor(date)).toBe('');
      expect(view.hasNote(date)).toBe(false);
    });

    it('noteFor reads the note by YYYY-MM-DD key from the store', () => {
      store.dayNotes.set({ '2024-02-15': 'Release' });

      expect(view.noteFor(date)).toBe('Release');
      expect(view.hasNote(date)).toBe(true);
    });

    it('hasNote is false for whitespace-only notes', () => {
      store.dayNotes.set({ '2024-02-15': '   ' });

      expect(view.hasNote(date)).toBe(false);
    });

    it('setNote writes the note to the store under the day key', () => {
      view.setNote(date, 'Demo');

      expect(store.dayNotes()).toEqual({ '2024-02-15': 'Demo' });
    });
  });

  describe('note popup state', () => {
    it('toggleNote opens the note for a key and closes it on the second call', () => {
      view.toggleNote('2024-02-15');
      expect(view.activeNoteKey()).toBe('2024-02-15');

      view.toggleNote('2024-02-15');
      expect(view.activeNoteKey()).toBeNull();
    });

    it('toggleNote switches to another key', () => {
      view.toggleNote('2024-02-15');
      view.toggleNote('2024-02-16');

      expect(view.activeNoteKey()).toBe('2024-02-16');
    });

    it('onDocumentClick closes the note when clicking outside', () => {
      view.toggleNote('2024-02-15');

      view.onDocumentClick(clickEventOn(''));

      expect(view.activeNoteKey()).toBeNull();
    });

    it('onDocumentClick keeps the note open when clicking the textarea or toggle', () => {
      view.toggleNote('2024-02-15');

      view.onDocumentClick(clickEventOn('day__note-textarea'));
      view.onDocumentClick(clickEventOn('day__note-toggle'));

      expect(view.activeNoteKey()).toBe('2024-02-15');
    });
  });

  describe('placeholdersBeforeWeek', () => {
    it('returns Mon..(first day - 1) placeholders for the first week', () => {
      const week = [day(2024, 2, 1), day(2024, 2, 2)]; // Thu, Fri

      expect(view.placeholdersBeforeWeek(week, 0)).toHaveLength(3);
    });

    it('returns none when the first week starts on Monday', () => {
      const week = [day(2024, 1, 1)]; // Mon

      expect(view.placeholdersBeforeWeek(week, 0)).toHaveLength(0);
    });

    it('returns none for non-first weeks', () => {
      const week = [day(2024, 2, 8)]; // Thu

      expect(view.placeholdersBeforeWeek(week, 1)).toHaveLength(0);
    });

    it('returns none for an empty week', () => {
      expect(view.placeholdersBeforeWeek([], 0)).toHaveLength(0);
    });
  });

  describe('placeholdersAfterWeek', () => {
    it('returns (last day + 1)..Fri placeholders for the last week', () => {
      const week = [day(2024, 2, 26), day(2024, 2, 29)]; // Mon .. Thu

      expect(view.placeholdersAfterWeek(week, 4, 5)).toHaveLength(1);
    });

    it('returns none when the last week ends on Friday', () => {
      const week = [day(2024, 5, 31)]; // Fri

      expect(view.placeholdersAfterWeek(week, 4, 5)).toHaveLength(0);
    });

    it('returns none for non-last weeks', () => {
      const week = [day(2024, 2, 5)]; // Mon

      expect(view.placeholdersAfterWeek(week, 1, 5)).toHaveLength(0);
    });

    it('returns none for an empty week', () => {
      expect(view.placeholdersAfterWeek([], 0, 1)).toHaveLength(0);
    });

    it('pads every week of the store month to exactly 5 cells', () => {
      const weeks = store.weeks();

      weeks.forEach((week: Week, i: number) => {
        const total =
          view.placeholdersBeforeWeek(week, i).length +
          week.length +
          view.placeholdersAfterWeek(week, i, weeks.length).length;
        expect(total).toBe(5);
      });
    });
  });

  describe('tooltips', () => {
    it('should initialize tooltips for day inputs on afterViewInit', () => {
      const mockTooltip = { dispose: vi.fn() };
      const TooltipMock = vi.fn(function (this: any) {
        Object.assign(this, mockTooltip);
      });
      (globalThis as any).bootstrap = {
        Tooltip: TooltipMock as any,
      };

      // Create mock day inputs
      const input = document.createElement('input');
      input.setAttribute('id', 'day-1-limit');
      input.setAttribute('data-bs-toggle', 'tooltip');
      input.setAttribute('data-bs-title', 'Test tooltip');
      document.body.appendChild(input);

      const monthViewComponent = TestBed.createComponent(MonthView).componentInstance;
      monthViewComponent.ngAfterViewInit();

      expect(TooltipMock).toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should dispose tooltips on component destroy', () => {
      const mockTooltip1 = { dispose: vi.fn() };
      const mockTooltip2 = { dispose: vi.fn() };

      const monthViewComponent = TestBed.createComponent(MonthView).componentInstance;
      (monthViewComponent as any).tooltips = [mockTooltip1, mockTooltip2];

      monthViewComponent.ngOnDestroy();

      expect(mockTooltip1.dispose).toHaveBeenCalled();
      expect(mockTooltip2.dispose).toHaveBeenCalled();
      expect((monthViewComponent as any).tooltips).toHaveLength(0);
    });

    it('should not crash if no day inputs are found', () => {
      const TooltipMock = vi.fn();
      (globalThis as any).bootstrap = {
        Tooltip: TooltipMock as any,
      };

      const monthViewComponent = TestBed.createComponent(MonthView).componentInstance;

      expect(() => {
        monthViewComponent.ngAfterViewInit();
      }).not.toThrow();
    });

    it('should pass correct tooltip configuration', () => {
      const mockTooltip = { dispose: vi.fn() };
      const TooltipMock = vi.fn(function (this: any) {
        Object.assign(this, mockTooltip);
      });
      (globalThis as any).bootstrap = {
        Tooltip: TooltipMock as any,
      };

      const input = document.createElement('input');
      input.setAttribute('id', 'day-1-limit');
      input.setAttribute('data-bs-toggle', 'tooltip');
      input.setAttribute('data-bs-title', 'Test tooltip');
      document.body.appendChild(input);

      const monthViewComponent = TestBed.createComponent(MonthView).componentInstance;
      monthViewComponent.ngAfterViewInit();

      expect(TooltipMock).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          placement: 'top',
          trigger: 'hover',
        }),
      );

      document.body.removeChild(input);
    });
  });
});
